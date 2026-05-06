/** @jsxImportSource preact */
/**
 * EXACT copy of ClipSlide's SlideshowPlayer YouTube logic.
 * Stripped of photo/gallery/pro features — ONLY YouTube playlist player.
 * This is a 1:1 port to test if their approach works on our site.
 */
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';

// Hardcoded test playlist — same videos as the main player
const TEST_PLAYLIST = [
  { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up' },
  { id: 'jNQXAC9IVRw', title: 'Me at the zoo' },
  { id: '9bZkp7q19f0', title: 'PSY - GANGNAM STYLE' },
];

export default function ClipSlideTest({ playlist }) {
  const tracks = (playlist && playlist.length > 0) ? playlist : TEST_PLAYLIST;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // YouTube player refs — EXACT same pattern as ClipSlide
  const youtubePlayerRef = useRef(null);
  const playerRef = useRef(null);
  const playerReadyRef = useRef(false);
  const hasUserGesturedRef = useRef(false);
  const lastAdvanceTimeRef = useRef(0);
  const handleNextRef = useRef(null);
  const isTouchDeviceRef = useRef(
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  );

  // Load YouTube API — EXACT ClipSlide code
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
    }
  }, []);

  // Initialize YouTube player — EXACT ClipSlide pattern
  useEffect(() => {
    if (tracks.length === 0) return;

    const first = tracks[0];

    const initPlayer = () => {
      if (playerRef.current) return;
      if (!youtubePlayerRef.current) {
        setTimeout(initPlayer, 50);
        return;
      }

      console.log('[ClipSlideTest] Initializing player with video:', first.id);

      playerRef.current = new window.YT.Player(youtubePlayerRef.current, {
        width: '100%',
        height: '100%',
        videoId: first.id,
        playerVars: {
          autoplay: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          mute: isTouchDeviceRef.current && !hasUserGesturedRef.current ? 1 : 0,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
        },
      });
    };

    if (!window.YT) {
      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          initPlayer();
        }
      }, 100);
    } else {
      initPlayer();
    }
  }, [tracks]);

  // EXACT ClipSlide onPlayerReady
  const onPlayerReady = (event) => {
    console.log('[ClipSlideTest] Player ready! Touch:', isTouchDeviceRef.current, 'Gestured:', hasUserGesturedRef.current);
    playerReadyRef.current = true;

    // Unmute if user gestured OR on desktop
    if (hasUserGesturedRef.current || !isTouchDeviceRef.current) {
      event.target.unMute();
      console.log('[ClipSlideTest] Unmuted (gesture or desktop)');
    } else {
      // Touch device, no gesture - mute initially
      event.target.mute();
      console.log('[ClipSlideTest] Muted (touch device)');
      
      // Auto-unmute after 1.5s
      setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.unMute();
          hasUserGesturedRef.current = true;
          console.log('[ClipSlideTest] Auto-unmuted after delay');
        }
      }, 1500);
    }
  };

  // EXACT ClipSlide onPlayerStateChange
  const onPlayerStateChange = (event) => {
    const states = { '-1': 'UNSTARTED', '0': 'ENDED', '1': 'PLAYING', '2': 'PAUSED', '3': 'BUFFERING', '5': 'CUED' };
    console.log('[ClipSlideTest] State:', states[event.data]);

    setIsPlaying(event.data === 1);

    // Auto-advance when video ends
    if (event.data === 0) {
      const now = Date.now();
      if (now - lastAdvanceTimeRef.current > 500) {
        lastAdvanceTimeRef.current = now;
        console.log('[ClipSlideTest] Video ended, advancing');
        handleNextRef.current?.();
      }
    }
  };

  // Load video when slide changes — EXACT ClipSlide pattern
  useEffect(() => {
    if (!playerRef.current || !playerReadyRef.current) return;

    const track = tracks[currentIndex];
    if (!track) return;

    console.log('[ClipSlideTest] Loading video:', track.id);

    try {
      playerRef.current.loadVideoById({
        videoId: track.id,
      });

      if (hasUserGesturedRef.current) {
        playerRef.current.playVideo();
      }
    } catch (error) {
      console.error('[ClipSlideTest] Error loading video:', error);
    }
  }, [currentIndex, tracks]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = prev + 1;
      return next >= tracks.length ? 0 : next;
    });
  }, [tracks.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? tracks.length - 1 : prev - 1));
  }, [tracks.length]);

  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  const current = tracks[currentIndex];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ marginBottom: '10px', fontSize: '18px', fontWeight: 'bold', color: '#ff4444' }}>
        ClipSlide Test Player (EXACT ClipSlide code)
      </h2>
      
      {/* YouTube player — NEVER destroyed */}
      <div style={{ aspectRatio: '16/9', background: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
        <div
          ref={youtubePlayerRef}
          style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
        />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#1a1a1a', borderRadius: '8px', marginBottom: '12px' }}>
        <button onClick={handlePrev} style={{ padding: '8px 16px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          ⏮ Prev
        </button>
        <button onClick={handleNext} style={{ padding: '8px 16px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Next ⏭
        </button>
        <span style={{ color: '#999', fontSize: '14px' }}>
          {currentIndex + 1} / {tracks.length} — {current.title}
        </span>
        <span style={{ color: isPlaying ? '#4f4' : '#f44', fontSize: '14px', marginLeft: 'auto' }}>
          {isPlaying ? '▶ PLAYING' : '⏸ PAUSED'}
        </span>
      </div>

      {/* Track list */}
      <div style={{ background: '#1a1a1a', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '8px 12px', fontSize: '12px', color: '#666', borderBottom: '1px solid #333' }}>
          PLAYLIST (click to test for ads)
        </div>
        {tracks.map((track, i) => (
          <button
            key={track.id}
            onClick={() => { hasUserGesturedRef.current = true; setCurrentIndex(i); }}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 12px',
              background: i === currentIndex ? '#333' : 'transparent',
              color: i === currentIndex ? '#4f4' : '#ccc',
              border: 'none',
              borderBottom: '1px solid #222',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {i + 1}. {track.title} {i === currentIndex && isPlaying ? '♫' : ''}
          </button>
        ))}
      </div>
    </div>
  );
}
