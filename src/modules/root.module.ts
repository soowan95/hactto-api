import { Module } from '@nestjs/common';
import { WinningNumberModule } from './winning-number/winning-number.module';
import { ReliabilityModule } from './reliability/reliability.module';
import { AlgorithmModule } from './algorithm/algorithm.module';
import { PersonalWeightModule } from './personal-weight/personal-weight.module';

@Module({
  imports: [
    WinningNumberModule,
    ReliabilityModule,
    AlgorithmModule,
    PersonalWeightModule,
  ],
  exports: [WinningNumberModule, ReliabilityModule, PersonalWeightModule],
})
export class RootModule {}
