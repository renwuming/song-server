import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { getLocalStrData } from 'src/i18n';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const ticket = req.headers['x-ticket'] as string;

    if (!ticket) {
      throw new UnauthorizedException(getLocalStrData('notLogged'));
    } else {
      next();
    }
  }
}
