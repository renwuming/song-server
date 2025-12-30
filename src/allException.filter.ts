import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as log4js from 'log4js';
import { isProduction } from './utils';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const logger = log4js.getLogger();
    logger.level = 'INFO';

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const isHttpException = exception instanceof HttpException;

    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = isHttpException
      ? exception.getResponse()
      : {
          statusCode,
          message: exception.toString(),
        };

    if (!isHttpException) {
      logger.error(exception.toString(), new Date());
    }

    // 生产环境，当错误码 >=500 时，具体的服务端错误不会暴露给客户端
    const ignoreMsgDetail =
      statusCode >= HttpStatus.INTERNAL_SERVER_ERROR && isProduction;
    if (ignoreMsgDetail && responseBody['message']) {
      responseBody['message'] = 'Internal Server Error';
    }

    response.status(statusCode).json(responseBody);
  }
}
