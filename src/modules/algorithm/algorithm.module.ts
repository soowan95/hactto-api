import { Module } from '@nestjs/common';
import { AlgorithmController } from './algorithm.controller';
import { AlgorithmService } from './algorithm.service';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AllowedClientGuard } from '../../common/guards/allowed-client.guard';

@Module({
  controllers: [AlgorithmController],
  providers: [AlgorithmService, AdminGuard, AllowedClientGuard],
})
export class AlgorithmModule {}
