import { Body, Controller, Get, Inject, Post, Req } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('games')
export class GameController {
  @Inject() private readonly gameService: GameService;

  @Post('/start')
  async startGame(@Body() body) {
    return this.gameService.startGame(body);
  }

  @Post('/push/data')
  async handlePushData(@Body() body, @Req() req) {
    return this.gameService.handlePushData(req, body);
  }

  // todo: 删除
  @Get('/test')
  async test() {
    return this.gameService.handlePushData({}, {});
  }
}
