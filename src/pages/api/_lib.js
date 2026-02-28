import Pusher from 'pusher';
import { Redis } from '@upstash/redis';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function saveRoom(roomId, roomObj) {
  try {
    const key = `rooms:${roomId}`;
    const v = JSON.stringify(roomObj);
    const res = await redis.set(key, v);
    console.log(`[upstash] set ${key} -> ${res}`);
    return res;
  } catch (err) {
    console.error('[upstash] saveRoom error', err?.message || err);
    throw err;
  }
}

export async function loadRoom(roomId) {
  try {
    const key = `rooms:${roomId}`;
    const v = await redis.get(key);
    console.log(`[upstash] get ${key} ->`, v ?? '(null)');
    if (v == null) return null;
    // Handle different return shapes from the Upstash client (string or object)
    if (typeof v === 'string') {
      try { return JSON.parse(v); } catch (e) { console.error('[upstash] parse error', e); return null; }
    }
    if (typeof v === 'object') {
      // common Upstash shapes: { value: '...'} or { result: '...'} or direct parsed object
      const candidate = v.value ?? v.result ?? v.data ?? null;
      if (candidate && typeof candidate === 'string') {
        try { return JSON.parse(candidate); } catch (e) { console.error('[upstash] parse error (candidate)', e); }
      }
      // If it's already an object (stored via client.set without stringifying), return it directly
      return v;
    }
    // Unknown type
    console.error('[upstash] unexpected get type', typeof v, v);
    return null;
  } catch (err) {
    console.error('[upstash] loadRoom error', err?.message || err);
    throw err;
  }
}

export async function delRoom(roomId) {
  try {
    const key = `rooms:${roomId}`;
    const res = await redis.del(key);
    console.log(`[upstash] del ${key} -> ${res}`);
    return res;
  } catch (err) {
    console.error('[upstash] delRoom error', err?.message || err);
    throw err;
  }
}

export { pusher, redis };
