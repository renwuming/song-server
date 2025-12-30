import { Body, Controller, Get, Head, Inject, Post, Req } from '@nestjs/common';
import { GameService } from './game.service';
import { verifySignature } from 'src/utils';

@Controller('games')
export class GameController {
  @Inject() private readonly gameService: GameService;

  @Post('/start')
  async startGame(@Body() body) {
    return this.gameService.startGame(body);
  }

  @Head('/push/data')
  async handlePushDataHead() {
    return;
  }
  @Post('/push/data')
  async handlePushData(@Body() body, @Req() req) {
    return this.gameService.handlePushData(req, body);
  }

  // todo: 删除
  @Get('/test')
  async test() {
    const valid = verifySignature({
      headers: {
        host: 'renwuming.com',
        connection: 'close',
        'content-length': '472',
        'x-msg-type': 'live_gift',
        'x-nonce-str': '31373335333936333730',
        'x-timestamp': '1767096439677',
        'x-signature': 'DHvYxhhIeRiHNczTMbgmeQ==',
        'content-type': 'application/json',
        'x-roomid': '1123456789012345678',
        'accept-encoding': 'gzip',
        'user-agent': 'Go-http-client/2.0',
      },
    });
    return valid;
    // return this.gameService.verifySignature({}, {});
  }
}
