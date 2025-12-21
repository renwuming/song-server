import Redis from 'ioredis';

let REDIS_CLIENT;
export function getRedis(): Redis {
  if (!REDIS_CLIENT) {
    REDIS_CLIENT = new Redis({
      port: 6379,
      host: '127.0.0.1',
    });
    REDIS_CLIENT.on('connect', () => {
      console.info('Redis connect success');
    });
    REDIS_CLIENT.on('error', () => {
      console.error('Redis connect fail');
    });
    return REDIS_CLIENT;
  } else {
    return REDIS_CLIENT;
  }
}
