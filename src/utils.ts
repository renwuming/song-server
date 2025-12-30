import Redis from 'ioredis';
import Client from '@open-dy/open_api_sdk';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';
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

export function verifySignature(req) {
  console.log(req);

  const PUSH_SECRET = configService.get<string>('PUSH_SECRET');
  const signature = req.headers['x-signature'];
  if (!signature || !PUSH_SECRET) {
    return false;
  }

  // 1. 获取列表中的header
  const headerKeys = ['x-timestamp', 'x-nonce-str', 'x-roomid', 'x-msg-type'];
  const headersToSign: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    const lowerKey = key.toLowerCase();
    if (headerKeys.includes(lowerKey) && value) {
      headersToSign[key] = Array.isArray(value) ? value[0] : value;
    }
  }

  // 2. 按 key 字典序从小到大排序
  const sortedKeys = Object.keys(headersToSign).sort();

  // 3. 将 key-value 按顺序连接起来，格式：key1=value1&key2=value2
  const headerString = sortedKeys
    .map((key) => `${key}=${headersToSign[key]}`)
    .join('&');

  console.log(headerString);

  // 4. 从 request 中获取原始 body 字符串
  // 优先使用 req.rawBody（通过 express.json 的 verify 选项保存的 Buffer）
  const bodyString = (req as any).rawBody?.toString('utf-8');

  console.log(bodyString);

  // 5. 直接拼接（无需连接符）headerString + bodyString + secret
  const stringToSign = headerString + bodyString + PUSH_SECRET;

  console.log(stringToSign);

  // 6. 使用 UTF-8 编码，进行 MD5 计算（16 bytes）
  const md5Hash = crypto
    .createHash('md5')
    .update(stringToSign, 'utf-8')
    .digest();

  console.log(md5Hash);

  // 7. 对 MD5 计算结果进行 base64 编码
  const calculatedSignature = md5Hash.toString('base64');

  console.log(calculatedSignature, signature);

  // 8. 比较计算出的 signature 和请求头中的 signature
  return calculatedSignature === signature;
}
