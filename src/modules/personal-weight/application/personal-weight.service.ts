import { Inject, Injectable, forwardRef } from '@nestjs/common';
import {
  IPersonalWeightRepository,
  PERSONAL_WEIGHT_REPOSITORY_TOKEN,
} from '../domain/ports/personal-weight.repository.interface';
import { DomainPersonalWeight } from '../domain/entities/personal-weight.entity';
import { AlgorithmType } from '@hactto/algorithm';
import { ReliabilityService } from '../../reliability/application/reliability.service';

@Injectable()
export class PersonalWeightService {
  constructor(
    @Inject(PERSONAL_WEIGHT_REPOSITORY_TOKEN)
    private readonly personalWeightRepository: IPersonalWeightRepository,
    @Inject(forwardRef(() => ReliabilityService))
    private readonly reliabilityService: ReliabilityService,
  ) {}

  async getWeights(
    visitorId: string,
    algorithm: AlgorithmType,
  ): Promise<DomainPersonalWeight | null> {
    return this.personalWeightRepository.findByUserAndAlgorithm(
      visitorId,
      algorithm,
    );
  }

  async findById(id: number): Promise<DomainPersonalWeight | null> {
    return this.personalWeightRepository.findById(id);
  }

  async setWeights(
    visitorId: string,
    algorithm: AlgorithmType,
    weights: number[],
  ): Promise<DomainPersonalWeight> {
    const domainPw = new DomainPersonalWeight(visitorId, algorithm, weights);
    const result = await this.personalWeightRepository.create(domainPw);

    // 해당 유저의 해당 알고리즘의 과거 모든 신뢰도 점수를 새 가중치로 재계산
    // result.id를 함께 전달하여 Reliability → PersonalWeight 연관관계도 업데이트
    await this.reliabilityService.recalculateForUserAndAlgorithm(
      visitorId,
      algorithm,
      weights,
      result.id,
    );

    return result;
  }
}
