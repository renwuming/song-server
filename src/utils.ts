import Redis from 'ioredis';
import Client from '@open-dy/open_api_sdk';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
const configService = new ConfigService();

// node
export const isStaging = process.env.NODE_ENV === 'staging';
export const isDev = process.env.NODE_ENV === 'dev';

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

let DY_CLIENT;
export function getClient() {
  if (!DY_CLIENT) {
    const APP_ID = configService.get<string>('APP_ID');
    const APP_SECRET = configService.get<string>('APP_SECRET');
    DY_CLIENT = new Client({ clientKey: APP_ID, clientSecret: APP_SECRET });
  }
  return DY_CLIENT;
}

export async function getAccessToken(forceUpdate = false) {
  const appName = configService.get<string>('APP_NAME');
  const cache = getRedis();
  const tokenKey = `${appName}_access_token`;
  const token = await cache.get(tokenKey);
  if (forceUpdate || !token) {
    const APP_ID = configService.get<string>('APP_ID');
    const APP_SECRET = configService.get<string>('APP_SECRET');
    if (!APP_ID || !APP_SECRET) {
      throw new InternalServerErrorException('APP_ID or APP_SECRET is not set');
    }
    try {
      const res = await fetch(
        'https://developer.toutiao.com/api/apps/v2/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appid: APP_ID,
            secret: APP_SECRET,
            grant_type: 'client_credential',
          }),
        },
      );
      const { data } = await res.json();
      const { access_token, expires_in } = data;
      await cache.set(tokenKey, access_token, () => {
        cache.expire(tokenKey, expires_in - 300);
      });
      return access_token;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to get access token');
    }
  } else {
    return token;
  }
}
