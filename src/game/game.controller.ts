import { Body, Controller, Get, Head, Inject, Post, Req } from '@nestjs/common';
import { GameService } from './game.service';

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
    return this.gameService.getTaskStatus('live_gift', '1123456789012345678');
  }
}
