import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AlgorithmService } from './algorithm.service';
import { AllAlgorithmTypesResponsesDto } from './dtos/responses/all-algorithm-types-responses.dto';
import { plainToInstance } from 'class-transformer';
import { Permission } from '../../common/decorators/permission.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

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
}
