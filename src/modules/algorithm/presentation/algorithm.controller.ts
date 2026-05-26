import { Controller, Get, Param, ParseEnumPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AlgorithmService } from '../application/algorithm.service';
import { AllAlgorithmTypesResponsesDto } from './dtos/responses/all-algorithm-types-responses.dto';
import { plainToInstance } from 'class-transformer';
import { Permission } from '../../../common/decorators/permission.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { GenerateWinningNumberResponseDto } from './dtos/responses/generate-winning-number-response.dto';
import { AlgorithmType } from '@hactto/algorithm';

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
  async getAllAlgorithmTypes(): Promise<AllAlgorithmTypesResponsesDto[]> {
    const allAlgorithmTypes: string[] =
      this.algorithmService.allAlgorithmTypes();
    return plainToInstance(AllAlgorithmTypesResponsesDto, allAlgorithmTypes);
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
  ): Promise<GenerateWinningNumberResponseDto> {
    return this.algorithmService.generate(type);
  }
}
