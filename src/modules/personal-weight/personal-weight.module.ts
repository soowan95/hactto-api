import { Module, forwardRef } from '@nestjs/common';
import { PersonalWeightController } from './presentation/personal-weight.controller';
import { PersonalWeightService } from './application/personal-weight.service';
import { ReliabilityModule } from '../reliability/reliability.module';
import { PERSONAL_WEIGHT_REPOSITORY_TOKEN } from './domain/ports/personal-weight.repository.interface';
import { InfraPersonalWeightRepository } from './infrastructure/adapters/infra-personal-weight.repository';

@Module({
  imports: [forwardRef(() => ReliabilityModule)],
  controllers: [PersonalWeightController],
  providers: [
    PersonalWeightService,
    {
      provide: PERSONAL_WEIGHT_REPOSITORY_TOKEN,
      useClass: InfraPersonalWeightRepository,
    },
  ],
  exports: [PersonalWeightService, PERSONAL_WEIGHT_REPOSITORY_TOKEN],
})
export class PersonalWeightModule {}
