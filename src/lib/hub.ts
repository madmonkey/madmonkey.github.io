import { siteConfig } from './config';

const HUB = siteConfig.hubUrl;

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/** Fetch the social timeline (posts from people you follow) */
export async function getTimeline(token: string, page = 1) {
  const res = await fetch(`${HUB}/api/timeline?page=${page}`, {
    headers: authHeaders(token),
  });
  return res.json();
}

/** Fetch the discover/global feed */
export async function getDiscover(page = 1, tag?: string) {
  const params = new URLSearchParams({ page: String(page) });
  if (tag) params.set('tag', tag);
  const res = await fetch(`${HUB}/api/timeline/discover?${params}`);
  return res.json();
}

/** Like a post */
export async function likePost(token: string, postId: string) {
  const res = await fetch(`${HUB}/api/interactions/like`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ postId }),
  });
  return res.json();
}

/** Unlike a post */
export async function unlikePost(token: string, postId: string) {
  const res = await fetch(`${HUB}/api/interactions/like`, {
    method: 'DELETE',
    headers: authHeaders(token),
    body: JSON.stringify({ postId }),
  });
  return res.json();
}

/** Follow a user */
export async function followUser(token: string, userId: string) {
  const res = await fetch(`${HUB}/api/interactions/follow`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ userId }),
  });
  return res.json();
}

/** Unfollow a user */
export async function unfollowUser(token: string, userId: string) {
  const res = await fetch(`${HUB}/api/interactions/follow`, {
    method: 'DELETE',
    headers: authHeaders(token),
    body: JSON.stringify({ userId }),
  });
  return res.json();
}

/** Post a comment */
export async function postComment(token: string, postId: string, body: string) {
  const res = await fetch(`${HUB}/api/interactions/comment`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ postId, body }),
  });
  return res.json();
}

/** Get comments for a post */
export async function getComments(postId: string) {
  const res = await fetch(`${HUB}/api/interactions/comments/${postId}`);
  return res.json();
}

/** Get notifications */
export async function getNotifications(token: string) {
  const res = await fetch(`${HUB}/api/interactions/notifications`, {
    headers: authHeaders(token),
  });
  return res.json();
}

/** Mark notifications as read */
export async function markRead(token: string, ids?: string[]) {
  const res = await fetch(`${HUB}/api/interactions/notifications/read`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ ids }),
  });
  return res.json();
}

/** Get user directory */
export async function getDirectory(page = 1, query?: string) {
  const params = new URLSearchParams({ page: String(page) });
  if (query) params.set('q', query);
  const res = await fetch(`${HUB}/api/directory?${params}`);
  return res.json();
}

/** Get user profile */
export async function getUserProfile(username: string) {
  const res = await fetch(`${HUB}/api/users/${username}`);
  return res.json();
}

/** Get current user info */
export async function getMe(token: string) {
  const res = await fetch(`${HUB}/api/auth/me`, {
    headers: authHeaders(token),
  });
  return res.json();
}

/** Search posts on the network */
export async function searchPosts(query: string, page = 1) {
  const params = new URLSearchParams({ q: query, page: String(page) });
  const res = await fetch(`${HUB}/api/timeline/search?${params}`);
  return res.json();
}

/** Trigger feed refresh */
export async function refreshFeed(token: string) {
  const res = await fetch(`${HUB}/api/feed/refresh`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return res.json();
}

/** Connect to SSE stream for real-time notifications */
export function connectStream(userId: string, onMessage: (data: any) => void) {
  const es = new EventSource(`${HUB}/api/stream?userId=${userId}`);
  es.onmessage = (e) => {
    try {
      onMessage(JSON.parse(e.data));
    } catch {}
  };
  es.onerror = () => {
    // Auto-reconnects by default
  };
  return es;
}
