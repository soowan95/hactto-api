import {
  BadRequestException,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { WinningNumberService } from './winning-number.service';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { plainToInstance } from 'class-transformer';
import { WinningNumberShowResponseDto } from './dtos/responses/winning-number-show-response.dto';
import { CheckAdmin } from 'src/common/decorators/check-admin.decorator';

@ApiTags('- Winning Number')
@Controller()
export class WinningNumberController {
  constructor(private readonly winningNumberService: WinningNumberService) {}

  @ApiOperation({
    summary: 'Get the winning number',
  })
  @ApiQuery({ name: 'e', required: false })
  @ResponseMessage('success.read')
  @Get('wn/show')
  async show(
    @Query('e', new ParseIntPipe({ optional: true }))
    episode: number | undefined,
  ): Promise<any> {
    let result: any;
    if (!episode) {
      result = await this.winningNumberService.findAll();
    } else {
      result = await this.winningNumberService.findByEpisode(episode);
    }
    return plainToInstance(WinningNumberShowResponseDto, result);
  }

  @ApiOperation({
    summary: 'Fetch all winning numbers from 동행복권',
  })
  @ApiQuery({ name: 'le', required: true })
  @CheckAdmin()
  @ResponseMessage('success.fetch.all')
  @Post('api/wn/all')
  async fetch(@Query('le') lastestEpisode: number): Promise<void> {
    if (!lastestEpisode)
      throw new BadRequestException('Lastest episode is required');
    await this.winningNumberService.fetch(lastestEpisode);
  }
}
