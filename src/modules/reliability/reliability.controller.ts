import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReliabilityService } from './reliability.service';

@ApiTags('- Reliability')
@Controller('api/rb')
export class ReliabilityController {
  constructor(private readonly reliabilityService: ReliabilityService) {}
}
