import Redis from 'ioredis';
import Client from '@open-dy/open_api_sdk';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
const configService = new ConfigService();
import CredentialClient from '@open-dy/open_api_credential';

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
      const credentialClient = new CredentialClient({
        clientKey: APP_ID,
        clientSecret: APP_SECRET,
      });
      const { accessToken, expiresIn } =
        await credentialClient.getClientToken();
      const expires_in = Math.floor((expiresIn - Date.now()) / 1000) - 300;
      await cache.set(tokenKey, accessToken, () => {
        cache.expire(tokenKey, expires_in);
      });
      return accessToken;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to get access token');
    }
  } else {
    return token;
  }
}
