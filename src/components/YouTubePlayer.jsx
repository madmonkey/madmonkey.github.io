/** @jsxImportSource preact */
import { useState, useEffect, useRef, useCallback, useMemo } from 'preact/hooks';

// Extract YouTube video ID from various URL formats
function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return m ? m[1] : null;
}

// Build YouTube embed URL — minimal params to match social.astro's ad-free approach
// Only enablejsapi + autoplay + origin. All track switching done via loadVideoById postMessage.
function buildEmbedUrl(videoId) {
  const origin = typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : '';
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&origin=${origin}`;
}

// Default labels
const defaults = {
  audioPlayer: '♫ Audio Player',
  videoPlayer: '▶ Player',
  play: 'Play',
  pause: 'Pause',
  previous: 'Previous',
  next: 'Next',
  playlist: 'Playlist',
  minimize: 'Minimize',
  expand: 'Expand player',
  changePosition: 'Change position',
  track: 'Track',
  youtubeVideo: 'YouTube video',
};

export default function YouTubePlayer({ url, heading, caption, audioOnly, display = 'docked', tracks, layout = 'contained', labels: userLabels = {}, startTime, endTime, useNativeControls = false }) {
  const L = { ...defaults, ...userLabels };
  const isFloating = display === 'floating';

  // Build playlist once — useMemo prevents new array reference on every render
  const playlist = useMemo(() => {
    const items = [];
    const mainId = getYouTubeId(url);
    if (mainId) items.push({
      id: mainId,
      title: heading || `${L.track} 1`,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
    });
    if (tracks && tracks.length) {
      tracks.forEach((t) => {
        const tid = getYouTubeId(t.url);
        if (tid) items.push({
          id: tid,
          title: t.title || `${L.track} ${items.length + 1}`,
          startTime: t.startTime || undefined,
          endTime: t.endTime || undefined,
        });
      });
    }
    return items;
  }, [url, heading, tracks, startTime, endTime]);

  if (playlist.length === 0) return null;

  return <InteractivePlayer
    playlist={playlist}
    audioOnly={audioOnly}
    isFloating={isFloating}
    heading={heading}
    caption={caption}
    layout={layout}
    L={L}
    useNativeControls={useNativeControls}
  />;
}

function InteractivePlayer({ playlist, audioOnly, isFloating, heading, caption, layout, L, useNativeControls }) {
  // Persist floating player state across Astro page navigations
  // On mobile/iPad, transition:persist re-hydrates the component with fresh state,
  // so we save/restore from window.__ytFloatingState
  const savedState = (isFloating && typeof window !== 'undefined') ? window.__ytFloatingState : null;

  const [currentIndex, setCurrentIndex] = useState(savedState?.currentIndex ?? 0);
  const [isPlaying, setIsPlaying] = useState(savedState?.isPlaying ?? false);
  const [started, setStarted] = useState(savedState?.started ?? false);
  const [volume, setVolume] = useState(savedState?.volume ?? 80);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [minimized, setMinimized] = useState(savedState?.minimized ?? false);
  const [closed, setClosed] = useState(false);
  const [position, setPosition] = useState(savedState?.position ?? { side: 'bottom' });
  const [progress, setProgress] = useState(savedState?.progress ?? 0);
  const [duration, setDuration] = useState(savedState?.duration ?? 0);
  const [dragOffset, setDragOffset] = useState(null);
  const [dragPos, setDragPos] = useState(null);

  // Direct iframe ref — NO YT.Player, NO iframe_api script
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const progressInterval = useRef(null);
  const isDragging = useRef(false);
  const handleNextRef = useRef(null);
  const lastAdvanceTimeRef = useRef(0);
  const currentRef = useRef(null);
  const hasUserGesturedRef = useRef(savedState?.started ?? false);
  const isTouchDeviceRef = useRef(typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
  const restoredFromState = useRef(!!savedState);
  const ytApiReady = useRef(false);
  const ytPendingVideoId = useRef(null);
  const iframeFirstLoaded = useRef(false);

  const hasPlaylist = playlist.length > 1;
  const current = playlist[currentIndex] || playlist[0];

  // Save floating player state to window for persistence across navigations
  useEffect(() => {
    if (!isFloating) return;
    window.__ytFloatingState = {
      currentIndex, isPlaying, started, volume, minimized, position, progress, duration,
    };
  }, [isFloating, currentIndex, isPlaying, started, volume, minimized, position, progress, duration]);

  // On mount: set iframe src imperatively (ONCE only, never via JSX attribute)
  // For floating restored state, skip src and just re-establish postMessage channel
  useEffect(() => {
    if (!iframeRef.current) return;
    const iframe = iframeRef.current;

    // If iframe already has a youtube src, it was loaded before (either from a previous
    // mount or transition:persist kept it alive). NEVER reload it — that causes ads.
    // Check the actual DOM src, not a ref (refs reset on re-hydration).
    const alreadyLoaded = iframe.src && iframe.src.includes('youtube.com/embed');

    if (alreadyLoaded) {
      // Re-establish postMessage channel with the surviving iframe
      iframeFirstLoaded.current = true;
      ytApiReady.current = true;
      setTimeout(() => {
        const win = iframe.contentWindow;
        if (!win) return;
        win.postMessage(JSON.stringify({ event: 'listening', id: 1 }), '*');
        setTimeout(() => {
          const w = iframe.contentWindow;
          if (!w) return;
          w.postMessage(JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }), '*');
        }, 300);
      }, 300);
    } else {
      // First ever mount — set iframe src imperatively
      iframeFirstLoaded.current = true;
      iframe.src = embedUrl;
    }
  }, []);
  currentRef.current = current;

  // ── postMessage command helper — sends commands to youtube-nocookie iframe ──
  const sendCommand = useCallback((func, args = []) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func,
      args,
    }), '*');
  }, []);

  // ── Listen for messages from the youtube-nocookie iframe ──
  useEffect(() => {
    const onMessage = (event) => {
      // Only accept messages from youtube-nocookie or youtube
      if (!event.origin.includes('youtube-nocookie.com') && !event.origin.includes('youtube.com')) return;

      let data;
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch { return; }

      if (!data || !data.event) return;

      // State changes: data.info can be a number directly or an object
      if (data.event === 'onStateChange') {
        const state = typeof data.info === 'object' ? data.info?.playerState : data.info;
        if (state === 1) { // PLAYING
          setIsPlaying(true);
          setStarted(true);
        } else if (state === 2) { // PAUSED
          setIsPlaying(false);
        } else if (state === 0) { // ENDED
          setIsPlaying(false);
          const now = Date.now();
          if (now - lastAdvanceTimeRef.current > 500) {
            lastAdvanceTimeRef.current = now;
            handleNextRef.current?.();
          }
        }
      }

      // infoDelivery carries currentTime, duration, volume, etc.
      if (data.event === 'infoDelivery' && data.info) {
        if (data.info.currentTime !== undefined) {
          setStarted(true);
          const cur = currentRef.current;
          const cs = cur.startTime || 0;
          setProgress(Math.max(0, data.info.currentTime - cs));
          if (cur.endTime && data.info.currentTime >= cur.endTime) {
            handleNextRef.current?.();
          }
        }
        if (data.info.duration !== undefined && data.info.duration > 0) {
          const cur = currentRef.current;
          setDuration((cur.endTime || data.info.duration) - (cur.startTime || 0));
        }
        if (data.info.playerState !== undefined) {
          const state = data.info.playerState;
          if (state === 1) { setIsPlaying(true); setStarted(true); }
          else if (state === 2) { setIsPlaying(false); }
          else if (state === 0) {
            setIsPlaying(false);
            const now = Date.now();
            if (now - lastAdvanceTimeRef.current > 500) {
              lastAdvanceTimeRef.current = now;
              handleNextRef.current?.();
            }
          }
        }
      }

      // onReady / initialDelivery — mark API as ready, flush any pending loadVideoById
      if (data.event === 'onReady' || data.event === 'initialDelivery') {
        ytApiReady.current = true;
        setStarted(true);
        if (ytPendingVideoId.current) {
          const vid = ytPendingVideoId.current;
          ytPendingVideoId.current = null;
          sendCommand('loadVideoById', [vid]);
        }
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // ── When iframe loads, subscribe to its events via postMessage ──
  const onIframeLoad = useCallback(() => {
    if (!iframeRef.current) return;
    const win = iframeRef.current.contentWindow;
    if (!win) return;

    // Reset API readiness — this iframe just loaded fresh
    ytApiReady.current = false;
    iframeFirstLoaded.current = true;

    // Send 'listening' to establish postMessage channel (same as social.astro's ytHandshake)
    win.postMessage(JSON.stringify({ event: 'listening', id: 1 }), '*');

    // Subscribe to player events explicitly
    setTimeout(() => {
      if (!iframeRef.current) return;
      const w = iframeRef.current.contentWindow;
      if (!w) return;
      // Subscribe to state changes
      w.postMessage(JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }), '*');
    }, 300);

    // Poll for current time updates to drive the scrubber
    clearInterval(progressInterval.current);
    progressInterval.current = setInterval(() => {
      if (!iframeRef.current || !iframeRef.current.contentWindow) {
        clearInterval(progressInterval.current);
        return;
      }
      iframeRef.current.contentWindow.postMessage(JSON.stringify({
        event: 'command', func: 'getCurrentTime',
      }), '*');
      iframeRef.current.contentWindow.postMessage(JSON.stringify({
        event: 'command', func: 'getDuration',
      }), '*');
      iframeRef.current.contentWindow.postMessage(JSON.stringify({
        event: 'command', func: 'getPlayerState',
      }), '*');
    }, 500);

    // Auto-unmute on touch devices after delay
    if (isTouchDeviceRef.current && !hasUserGesturedRef.current) {
      setTimeout(() => {
        sendCommand('unMute');
        hasUserGesturedRef.current = true;
      }, 1500);
    }
  }, [sendCommand]);

  // Clean up progress interval on unmount
  useEffect(() => {
    return () => clearInterval(progressInterval.current);
  }, []);

  // ── Volume ──
  useEffect(() => {
    sendCommand('setVolume', [volume]);
  }, [volume, sendCommand]);

  // ── Track change — swap video via postMessage with plain string ID (never reload iframe) ──
  const prevIndexRef = useRef(-1);
  useEffect(() => {
    if (prevIndexRef.current === -1) {
      prevIndexRef.current = currentIndex;
      return;
    }
    if (prevIndexRef.current === currentIndex) return;
    prevIndexRef.current = currentIndex;
    const t = playlist[currentIndex];
    if (!t) return;
    // Use plain string videoId — same as social.astro. Object format causes iframe reload + ads.
    if (ytApiReady.current) {
      sendCommand('loadVideoById', [t.id]);
    } else {
      ytPendingVideoId.current = t.id;
    }
  }, [currentIndex, playlist, sendCommand]);

  // ── Controls ──
  const togglePlay = useCallback(() => {
    hasUserGesturedRef.current = true;
    if (isPlaying) {
      sendCommand('pauseVideo');
    } else {
      sendCommand('unMute');
      sendCommand('playVideo');
    }
  }, [isPlaying, sendCommand]);

  const skipTo = useCallback((idx) => {
    hasUserGesturedRef.current = true;
    setProgress(0);
    setDuration(0);
    setCurrentIndex(idx);
  }, []);

  const prevTrack = useCallback(() => {
    hasUserGesturedRef.current = true;
    setProgress(0);
    setDuration(0);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : playlist.length - 1));
  }, [playlist.length]);

  const nextTrack = useCallback(() => {
    hasUserGesturedRef.current = true;
    setProgress(0);
    setDuration(0);
    setCurrentIndex((prev) => (prev < playlist.length - 1 ? prev + 1 : 0));
  }, [playlist.length]);

  useEffect(() => { handleNextRef.current = nextTrack; }, [nextTrack]);

  const seekTo = useCallback((e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const clipStart = currentRef.current.startTime || 0;
    const time = clipStart + pct * duration;
    sendCommand('seekTo', [time, true]);
    setProgress(pct * duration);
  }, [duration, sendCommand]);

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const cycleSide = useCallback(() => {
    setDragPos(null);
    const sides = ['bottom', 'right', 'left'];
    const idx = sides.indexOf(position.side);
    setPosition({ side: sides[(idx + 1) % sides.length] });
  }, [position.side]);

  // ── Drag handlers ──
  const onDragStart = useCallback((e) => {
    if (!isFloating || !containerRef.current) return;
    if (e.target.closest('button, input, [role="button"]')) return;
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    const rect = containerRef.current.getBoundingClientRect();
    isDragging.current = true;
    setDragOffset({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
  }, [isFloating]);

  const onDragMove = useCallback((e) => {
    if (!isDragging.current || !dragOffset) return;
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    const x = Math.max(0, Math.min(window.innerWidth - 60, touch.clientX - dragOffset.x));
    const y = Math.max(0, Math.min(window.innerHeight - 60, touch.clientY - dragOffset.y));
    setDragPos({ x, y });
  }, [dragOffset]);

  const onDragEnd = useCallback(() => {
    isDragging.current = false;
    setDragOffset(null);
  }, []);

  useEffect(() => {
    if (!isFloating) return;
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('touchend', onDragEnd);
    return () => {
      window.removeEventListener('mousemove', onDragMove);
      window.removeEventListener('mouseup', onDragEnd);
      window.removeEventListener('touchmove', onDragMove);
      window.removeEventListener('touchend', onDragEnd);
    };
  }, [isFloating, onDragMove, onDragEnd]);

  // ── Player iframe style — visibility via CSS only ──
  const getPlayerStyle = () => {
    if (isFloating && minimized) {
      return { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', opacity: 0, pointerEvents: 'none' };
    }
    if (isFloating && !audioOnly) {
      // Video visible inside the floating card — rendered inline
      return { aspectRatio: '16/9', background: '#000', width: '100%' };
    }
    if (audioOnly) {
      return { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', opacity: 0, pointerEvents: 'none' };
    }
    return { aspectRatio: '16/9', background: '#000', width: '100%' };
  };

  // Build the initial embed URL — only used for first mount (not on re-hydration)
  // Subsequent tracks swap via postMessage loadVideoById to preserve iframe session (no new ads)
  const initialTrack = playlist[0];
  const embedUrl = buildEmbedUrl(initialTrack.id);

  // ═══════════════════════════════════════════
  // ── DOCKED PLAYER ──
  // ═══════════════════════════════════════════
  if (!isFloating) {
    const wrapperClass = layout === 'full' ? '' : 'max-w-4xl mx-auto';
    return (
      <section class={`mb-12 ${wrapperClass}`}>
        {heading && <h2 class="mb-4 text-xl font-semibold">{heading}</h2>}

        {/* Single persistent iframe — src set imperatively on mount, tracks swap via postMessage */}
        <div class="rounded-lg overflow-hidden mb-3" style="aspect-ratio:16/9;background:#000">
          <iframe
            ref={iframeRef}
            onLoad={onIframeLoad}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="autoplay; encrypted-media"
            allowFullScreen
            title={current.title}
          />
        </div>

        <div class="rounded-lg border overflow-hidden" style="border-color:var(--ps-card-border);background:var(--ps-card-bg)">
          <div class="flex items-center gap-3 p-4">
            <button onClick={togglePlay} class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style="background:var(--ps-primary);color:#fff" aria-label={isPlaying ? L.pause : L.play}>
              {isPlaying
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
              }
            </button>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium truncate" style="color:var(--ps-text)">{current.title}</div>
              {started && (
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs" style="color:var(--ps-text-faint)">{formatTime(progress)}</span>
                  <div class="flex-1 rounded-full cursor-pointer py-2" onClick={seekTo}>
                    <div class="h-2 rounded-full relative" style="background:var(--ps-border)">
                      <div class="h-full rounded-full transition-all" style={`width:${duration ? (progress / duration * 100) : 0}%;background:var(--ps-primary);pointer-events:none`} />
                    </div>
                  </div>
                  <span class="text-xs" style="color:var(--ps-text-faint)">{formatTime(duration)}</span>
                </div>
              )}
            </div>
            {hasPlaylist && (
              <div class="flex items-center gap-1">
                <button onClick={prevTrack} class="p-1.5 rounded" style="color:var(--ps-text-muted)" aria-label={L.previous}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="19,20 9,12 19,4"/><rect x="5" y="4" width="3" height="16"/></svg>
                </button>
                <button onClick={nextTrack} class="p-1.5 rounded" style="color:var(--ps-text-muted)" aria-label={L.next}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,4 15,12 5,20"/><rect x="16" y="4" width="3" height="16"/></svg>
                </button>
              </div>
            )}
            <div class="flex items-center gap-1.5 w-24">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--ps-text-faint);flex-shrink:0"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
              <input type="range" min="0" max="100" value={volume} onInput={(e) => setVolume(Number(e.target.value))}
                class="w-full h-1 rounded-full appearance-none cursor-pointer"
                style="accent-color:var(--ps-primary);background:var(--ps-border)"
              />
            </div>
            {hasPlaylist && (
              <button onClick={() => setShowPlaylist(!showPlaylist)} class="p-1.5 rounded" style={`color:${showPlaylist ? 'var(--ps-primary)' : 'var(--ps-text-muted)'}`} aria-label={L.playlist}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </button>
            )}
          </div>
          {hasPlaylist && showPlaylist && (
            <div class="border-t px-2 py-1 max-h-48 overflow-y-auto" style="border-color:var(--ps-border)">
              {playlist.map((track, i) => (
                <button key={track.id} onClick={() => skipTo(i)}
                  class="w-full flex items-center gap-2 px-3 py-2 rounded text-left text-sm transition"
                  style={`color:${i === currentIndex ? 'var(--ps-primary)' : 'var(--ps-text)'};background:${i === currentIndex ? 'var(--ps-surface-hover)' : 'transparent'}`}
                >
                  <span class="w-5 text-xs text-right flex-shrink-0" style="color:var(--ps-text-faint)">
                    {i === currentIndex && isPlaying ? '♫' : `${i + 1}`}
                  </span>
                  <span class="truncate">{track.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {caption && <p class="mt-2 text-sm text-center" style="color:var(--ps-text-muted)">{caption}</p>}
      </section>
    );
  }

  // ═══════════════════════════════════════════
  // ── FLOATING MINI PLAYER ──
  // ═══════════════════════════════════════════
  if (closed) return null;

  const floatingWidth = !audioOnly && !minimized ? '420px' : (minimized ? '48px' : '380px');
  const posStyles = {
    bottom: { bottom: '72px', left: '50%', transform: 'translateX(-50%)', maxWidth: floatingWidth },
    right: { bottom: '72px', right: '16px', maxWidth: floatingWidth },
    left: { bottom: '72px', left: '16px', maxWidth: floatingWidth },
  };
  const pos = dragPos
    ? { left: `${dragPos.x}px`, top: `${dragPos.y}px`, maxWidth: floatingWidth }
    : (posStyles[position.side] || posStyles.bottom);

  return (
    <div ref={containerRef}
      style={{
        position: 'fixed', zIndex: 9999,
        transition: isDragging.current ? 'none' : 'all 0.3s ease',
        ...pos,
        width: minimized ? '48px' : '100%',
      }}
    >
      {/* Minimized FAB button — shown on top of hidden card */}
      {minimized && (
        <button onClick={() => setMinimized(false)}
          class="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
          style="background:var(--ps-primary);color:#fff"
          aria-label={L.expand}
        >
          {isPlaying
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
          }
        </button>
      )}

      {/* Card — always rendered so iframe persists, but hidden when minimized */}
      <div class="rounded-xl shadow-2xl border overflow-hidden"
        style={{
          background: 'var(--ps-card-bg)',
          borderColor: 'var(--ps-card-border)',
          backdropFilter: 'blur(20px)',
          ...(minimized ? { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', opacity: 0, pointerEvents: 'none' } : {}),
        }}
      >
          {/* Single iframe — visible when video mode, hidden when audio-only */}
          <div style={audioOnly
            ? { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', opacity: 0, pointerEvents: 'none' }
            : { aspectRatio: '16/9', background: '#000', width: '100%' }
          }>
            <iframe
              ref={iframeRef}
              onLoad={onIframeLoad}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; encrypted-media"
              allowFullScreen
              title={current.title}
            />
          </div>

          <div class="flex items-center justify-between px-3 py-1.5 border-b"
            style="border-color:var(--ps-border);cursor:grab;user-select:none;-webkit-user-select:none"
            onMouseDown={onDragStart}
            onTouchStart={onDragStart}
          >
            <button onClick={cycleSide} class="text-xs px-1.5 py-0.5 rounded" style="color:var(--ps-text-faint)" aria-label={L.changePosition} title={L.changePosition}>
              ⇄
            </button>
            <span class="text-xs font-medium truncate mx-2 flex items-center gap-1" style="color:var(--ps-text-faint)">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style="opacity:0.5"><circle cx="9" cy="5" r="2"/><circle cx="15" cy="5" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="19" r="2"/><circle cx="15" cy="19" r="2"/></svg>
              {audioOnly ? L.audioPlayer : L.videoPlayer}
            </span>
            <div class="flex items-center gap-1">
              <button onClick={() => setMinimized(true)} class="text-xs px-1.5 py-0.5 rounded" style="color:var(--ps-text-faint)" aria-label={L.minimize} title={L.minimize}>
                ─
              </button>
              <button onClick={() => { sendCommand('pauseVideo'); setClosed(true); }} class="text-xs px-1.5 py-0.5 rounded" style="color:var(--ps-text-faint)" aria-label="Close" title="Close">
                ✕
              </button>
            </div>
          </div>

          {started && (
            <div class="cursor-pointer py-1" onClick={seekTo}>
              <div class="h-1.5 relative" style="background:var(--ps-border)">
                <div class="h-full transition-all" style={`width:${duration ? (progress / duration * 100) : 0}%;background:var(--ps-primary);pointer-events:none`} />
              </div>
            </div>
          )}

          <div class="flex items-center gap-2 px-3 py-2">
            {hasPlaylist && (
              <button onClick={prevTrack} class="p-1 rounded" style="color:var(--ps-text-muted)" aria-label={L.previous}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="19,20 9,12 19,4"/><rect x="5" y="4" width="3" height="16"/></svg>
              </button>
            )}
            <button onClick={togglePlay} class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style="background:var(--ps-primary);color:#fff" aria-label={isPlaying ? L.pause : L.play}>
              {isPlaying
                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
              }
            </button>
            {hasPlaylist && (
              <button onClick={nextTrack} class="p-1 rounded" style="color:var(--ps-text-muted)" aria-label={L.next}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,4 15,12 5,20"/><rect x="16" y="4" width="3" height="16"/></svg>
              </button>
            )}
            <div class="flex-1 min-w-0 mx-1">
              <div class="text-xs font-medium truncate" style="color:var(--ps-text)">{current.title}</div>
              {started && <div class="text-xs" style="color:var(--ps-text-faint)">{formatTime(progress)} / {formatTime(duration)}</div>}
            </div>
            <input type="range" min="0" max="100" value={volume} onInput={(e) => setVolume(Number(e.target.value))}
              class="w-14 h-1 rounded-full appearance-none cursor-pointer"
              style="accent-color:var(--ps-primary);background:var(--ps-border)"
            />
            {hasPlaylist && (
              <button onClick={() => setShowPlaylist(!showPlaylist)} class="p-1 rounded" style={`color:${showPlaylist ? 'var(--ps-primary)' : 'var(--ps-text-muted)'}`} aria-label={L.playlist}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </button>
            )}
          </div>

          {hasPlaylist && showPlaylist && (
            <div class="border-t px-1 py-1 max-h-40 overflow-y-auto" style="border-color:var(--ps-border)">
              {playlist.map((track, i) => (
                <button key={track.id} onClick={() => skipTo(i)}
                  class="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition"
                  style={`color:${i === currentIndex ? 'var(--ps-primary)' : 'var(--ps-text)'};background:${i === currentIndex ? 'var(--ps-surface-hover)' : 'transparent'}`}
                >
                  <span class="w-4 text-right flex-shrink-0" style="color:var(--ps-text-faint)">
                    {i === currentIndex && isPlaying ? '♫' : `${i + 1}`}
                  </span>
                  <span class="truncate">{track.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
    </div>
  );
}
