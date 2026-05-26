import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { WinningNumberService } from '../application/winning-number.service';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { WinningNumberShowResponseDto } from '../application/dtos/winning-number-show-response.dto';
import { Admin } from '../../../common/decorators/admin.decorator';

@ApiTags('- Winning Number')
@Controller('winning-numbers')
export class WinningNumberController {
  constructor(private readonly winningNumberService: WinningNumberService) {}

  @ApiOperation({
    summary: 'Get all winning numbers',
  })
  @ResponseMessage('success.read')
  @Get()
  async findAll(): Promise<WinningNumberShowResponseDto[]> {
    return this.winningNumberService.findAll();
  }

  @ApiOperation({
    summary: 'Get the winning number by episode',
  })
  @ApiParam({ name: 'episode', required: true, description: '회차 번호' })
  @ResponseMessage('success.read')
  @Get(':episode')
  async findByEpisode(
    @Param('episode', ParseIntPipe) episode: number,
  ): Promise<WinningNumberShowResponseDto> {
    return this.winningNumberService.findByEpisode(episode);
  }

  @ApiOperation({
    summary: 'Fetch all winning numbers from 동행복권',
  })
  @ApiQuery({
    name: 'latestEpisode',
    required: true,
    description: '최근 회차 번호',
  })
  @Admin()
  @ResponseMessage('success.fetch.all')
  @Post('fetch')
  async fetch(
    @Query('latestEpisode', ParseIntPipe) latestEpisode: number,
  ): Promise<void> {
    await this.winningNumberService.fetch(latestEpisode);
  }
}
