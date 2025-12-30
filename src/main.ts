import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 使用 express.json 的 verify 选项来保存原始 body
  app.use(
    express.json({
      verify: (req: any, res, buf) => {
        // 保存原始 body Buffer，后续可以转为字符串
        req.rawBody = buf;
      },
    }),
  );

  app.enableCors();

  const port = process.env.PORT || 6789;
  await app.listen(port);
}
bootstrap();
