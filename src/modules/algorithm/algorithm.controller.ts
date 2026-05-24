import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AlgorithmService } from './algorithm.service';
import { AllAlgorithmTypesResponsesDto } from './dtos/responses/all-algorithm-types-responses.dto';
import { plainToInstance } from 'class-transformer';
import { Permission } from '../../common/decorators/permission.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { GenerateWinningNumberRequestDto } from './dtos/requests/generate-winning-number-request.dto';
import { GenerateWinningNumberResponseDto } from './dtos/responses/generate-winning-number-response.dto';
import { AlgorithmResult } from '../../lib/prisma';

@ApiTags('- Algorithm')
@Controller('api/algo')
export class AlgorithmController {
  constructor(private readonly algorithmService: AlgorithmService) {}

  @ApiOperation({
    summary: 'Get all algorithm types',
  })
  @Permission()
  @ResponseMessage('success.read')
  @Get('all')
  async getAllAlgorithmTypes(): Promise<AllAlgorithmTypesResponsesDto[]> {
    const allAlgorithmTypes: string[] =
      this.algorithmService.allAlgorithmTypes();
    return plainToInstance(AllAlgorithmTypesResponsesDto, allAlgorithmTypes);
  }

  @ApiOperation({
    summary: 'Generate winning number',
  })
  @Permission()
  @ResponseMessage('success.generate')
  @Post('generate')
  async generateWinningNumber(
    @Query() request: GenerateWinningNumberRequestDto,
  ): Promise<GenerateWinningNumberResponseDto> {
    const result: AlgorithmResult = await this.algorithmService.generate(
      request.t,
    );
    return plainToInstance(GenerateWinningNumberResponseDto, result);
  }
}
