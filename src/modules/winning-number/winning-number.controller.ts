import { Controller, Get, Query } from '@nestjs/common';
import { WinningNumberService } from './winning-number.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { plainToInstance } from 'class-transformer';
import { WinningNumberShowResponseDto } from './dtos/responses/winning-number-show-response.dto';

@ApiTags('- Winning Number')
@Controller('wn')
export class WinningNumberController {
  constructor(private readonly winningNumberService: WinningNumberService) {}

  @ApiOperation({
    summary: 'Get the winning number of specific round',
  })
  @ResponseMessage('success.read')
  @Get('show')
  async show(@Query('r') round: number | undefined): Promise<any> {
    let result: any;
    if (!round) {
      result = await this.winningNumberService.findAll();
    } else {
      result = await this.winningNumberService.findByRound(round);
    }
    return plainToInstance(WinningNumberShowResponseDto, result);
  }
}
