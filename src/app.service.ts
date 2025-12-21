import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRedis } from './utils';

@Injectable()
export class AppService {
  @Inject() private configService: ConfigService;

  getHello(): string {
    return 'Hello World!';
  }

  async getAccessToken(forceUpdate = false) {
    const appName = this.configService.get<string>('APP_NAME');
    const cache = getRedis();
    const tokenKey = `${appName}_access_token`;
    const token = await cache.get(tokenKey);
    if (forceUpdate || !token) {
      const APP_ID = this.configService.get<string>('APP_ID');
      const APP_SECRET = this.configService.get<string>('APP_SECRET');
      if (!APP_ID || !APP_SECRET) {
        throw new InternalServerErrorException(
          'APP_ID or APP_SECRET is not set',
        );
      }
      try {
        const response = await fetch(
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
        const { data } = await response.json();
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
}
