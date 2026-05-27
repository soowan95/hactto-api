import {
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Post,
  Ip,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AlgorithmService } from '../application/algorithm.service';
import { AllAlgorithmTypesResponsesDto } from './dtos/responses/all-algorithm-types-responses.dto';
import { plainToInstance } from 'class-transformer';
import { Permission } from '../../../common/decorators/permission.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { GenerateWinningNumberResponseDto } from './dtos/responses/generate-winning-number-response.dto';
import { AlgorithmType } from '@hactto/algorithm';
import { AlgorithmHistoryResponseDto } from './dtos/responses/algorithm-history-response.dto';

@ApiTags('- Algorithm')
@Controller('algorithms')
export class AlgorithmController {
  constructor(private readonly algorithmService: AlgorithmService) {}

  @ApiOperation({
    summary: 'Get all algorithm types',
  })
  @Permission()
  @ResponseMessage('success.read')
  @Get()
  async getAllAlgorithmTypes(): Promise<AllAlgorithmTypesResponsesDto> {
    const allAlgorithmTypes: string[] =
      this.algorithmService.allAlgorithmTypes();
    return plainToInstance(AllAlgorithmTypesResponsesDto, {
      types: allAlgorithmTypes,
    });
  }

  @ApiOperation({
    summary: 'Generate winning number',
  })
  @ApiParam({ name: 'type', enum: AlgorithmType, description: '알고리즘 타입' })
  @Permission()
  @ResponseMessage('success.generate')
  @Post(':type/generate')
  async generateWinningNumber(
    @Param('type', new ParseEnumPipe(AlgorithmType)) type: AlgorithmType,
    @Ip() ip: string,
    @Query('visitorId') visitorId?: string,
  ): Promise<GenerateWinningNumberResponseDto> {
    return this.algorithmService.generate(type, ip, visitorId);
  }

  @ApiOperation({
    summary: 'Get prediction history for a user',
  })
  @Permission()
  @ResponseMessage('success.read')
  @Get('history')
  async getHistory(
    @Ip() ip: string,
    @Query('visitorId') visitorId?: string,
  ): Promise<AlgorithmHistoryResponseDto[]> {
    const results = await this.algorithmService.getHistory(ip, visitorId);
    return plainToInstance(AlgorithmHistoryResponseDto, results);
  }
}
