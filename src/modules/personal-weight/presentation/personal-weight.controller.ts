import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  ParseEnumPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { PersonalWeightService } from '../application/personal-weight.service';
import { AlgorithmType } from '@hactto/algorithm';
import { SetPersonalWeightRequestDto } from './dtos/requests/set-personal-weight-request.dto';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { Permission } from '../../../common/decorators/permission.decorator';

@ApiTags('- Personal Weight')
@Controller('personal-weights')
export class PersonalWeightController {
  constructor(private readonly personalWeightService: PersonalWeightService) {}

  @ApiOperation({ summary: '개인화 가중치 저장 및 업데이트' })
  @Permission()
  @ResponseMessage('success.create')
  @Post()
  async setWeights(@Body() dto: SetPersonalWeightRequestDto) {
    const result = await this.personalWeightService.setWeights(
      dto.visitorId,
      dto.algorithm,
      dto.weights,
    );
    return {
      visitorId: result.visitorId,
      algorithm: result.algorithm,
      weights: result.getWeightsArray(),
    };
  }

  @ApiOperation({ summary: '개인화 가중치 조회' })
  @ApiQuery({ name: 'visitorId', type: String, required: true })
  @ApiQuery({ name: 'algorithm', enum: AlgorithmType, required: true })
  @Permission()
  @ResponseMessage('success.read')
  @Get()
  async getWeights(
    @Query('visitorId') visitorId: string,
    @Query('algorithm', new ParseEnumPipe(AlgorithmType))
    algorithm: AlgorithmType,
  ) {
    const result = await this.personalWeightService.getWeights(
      visitorId,
      algorithm,
    );
    if (!result) return null;
    return {
      visitorId: result.visitorId,
      algorithm: result.algorithm,
      weights: result.getWeightsArray(),
    };
  }
}
