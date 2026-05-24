import { Module } from '@nestjs/common';
import { AlgorithmController } from './algorithm.controller';
import { AlgorithmService } from './algorithm.service';
import { WinningNumberModule } from '../winning-number/winning-number.module';

@Module({
  imports: [WinningNumberModule],
  controllers: [AlgorithmController],
  providers: [AlgorithmService],
  exports: [AlgorithmService],
})
export class AlgorithmModule {}
