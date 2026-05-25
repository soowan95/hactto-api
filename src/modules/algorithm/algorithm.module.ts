import { Module } from '@nestjs/common';
import { AlgorithmController } from './presentation/algorithm.controller';
import { AlgorithmService } from './application/algorithm.service';
import { WinningNumberModule } from '../winning-number/winning-number.module';
import { ALGORITHM_RESULT_REPOSITORY_TOKEN } from './domain/ports/algorithm-result.repository.interface';
import { PrismaAlgorithmResultRepository } from './infrastructure/adapters/prisma-algorithm-result.repository';

@Module({
  imports: [WinningNumberModule],
  controllers: [AlgorithmController],
  providers: [
    AlgorithmService,
    {
      provide: ALGORITHM_RESULT_REPOSITORY_TOKEN,
      useClass: PrismaAlgorithmResultRepository,
    },
  ],
  exports: [AlgorithmService, ALGORITHM_RESULT_REPOSITORY_TOKEN],
})
export class AlgorithmModule {}
