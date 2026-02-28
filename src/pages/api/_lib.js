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
  await redis.set(`rooms:${roomId}`, JSON.stringify(roomObj));
}

export async function loadRoom(roomId) {
  const v = await redis.get(`rooms:${roomId}`);
  if (!v) return null;
  try { return JSON.parse(v); } catch (e) { return null; }
}

export async function delRoom(roomId) {
  await redis.del(`rooms:${roomId}`);
}

export { pusher, redis };
