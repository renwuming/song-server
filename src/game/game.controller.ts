import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('games')
export class GameController {
  @Inject() private readonly gameService: GameService;

  @Post('/start')
  async startGame(@Body() body) {
    return this.gameService.startGame(body);
  }

  // todo: 删除
  @Get('/test')
  async test() {
    return this.gameService.stopTask('live_comment', 'bwOIqIDZ2F');
  }
}
