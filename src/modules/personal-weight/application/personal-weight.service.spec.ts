import { Test, TestingModule } from '@nestjs/testing';
import { PersonalWeightService } from './personal-weight.service';
import { PERSONAL_WEIGHT_REPOSITORY_TOKEN } from '../domain/ports/personal-weight.repository.interface';
import { ReliabilityService } from '../../reliability/application/reliability.service';
import { AlgorithmType } from '@hactto/algorithm';
import { DomainPersonalWeight } from '../domain/entities/personal-weight.entity';

describe('PersonalWeightService', () => {
  let service: PersonalWeightService;
  let mockPersonalWeightRepository: any;
  let mockReliabilityService: any;

  const VALID_WEIGHTS = [25, 20, 15, 15, 10, 10, 5]; // 합계 100

  beforeEach(async () => {
    mockPersonalWeightRepository = {
      findByUserAndAlgorithm: jest.fn(),
      create: jest.fn(),
    };

    mockReliabilityService = {
      recalculateForUserAndAlgorithm: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonalWeightService,
        {
          provide: PERSONAL_WEIGHT_REPOSITORY_TOKEN,
          useValue: mockPersonalWeightRepository,
        },
        {
          provide: ReliabilityService,
          useValue: mockReliabilityService,
        },
      ],
    }).compile();

    service = module.get<PersonalWeightService>(PersonalWeightService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getWeights', () => {
    it('해당 이용자와 알고리즘에 저장된 가중치가 있으면 반환해야 한다', async () => {
      const expected = new DomainPersonalWeight(
        'visitor-1',
        AlgorithmType.MIN_COUNT,
        VALID_WEIGHTS,
        1,
      );
      mockPersonalWeightRepository.findByUserAndAlgorithm.mockResolvedValue(
        expected,
      );

      const result = await service.getWeights(
        'visitor-1',
        AlgorithmType.MIN_COUNT,
      );

      expect(
        mockPersonalWeightRepository.findByUserAndAlgorithm,
      ).toHaveBeenCalledWith('visitor-1', AlgorithmType.MIN_COUNT);
      expect(result).toEqual(expected);
    });

    it('저장된 가중치가 없으면 null을 반환해야 한다', async () => {
      mockPersonalWeightRepository.findByUserAndAlgorithm.mockResolvedValue(
        null,
      );

      const result = await service.getWeights(
        'visitor-unknown',
        AlgorithmType.MIN_COUNT,
      );

      expect(result).toBeNull();
    });
  });

  describe('setWeights', () => {
    it('가중치를 저장하고 신뢰도 재계산을 트리거해야 한다', async () => {
      const savedDomain = new DomainPersonalWeight(
        'visitor-1',
        AlgorithmType.MIN_COUNT,
        VALID_WEIGHTS,
        42,
      );
      mockPersonalWeightRepository.create.mockResolvedValue(savedDomain);

      const result = await service.setWeights(
        'visitor-1',
        AlgorithmType.MIN_COUNT,
        VALID_WEIGHTS,
      );

      // 리포지토리 create 호출 확인
      expect(mockPersonalWeightRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          visitorId: 'visitor-1',
          algorithm: AlgorithmType.MIN_COUNT,
        }),
      );

      // 저장 후 신뢰도 재계산 호출 확인 (저장된 id도 함께 전달)
      expect(
        mockReliabilityService.recalculateForUserAndAlgorithm,
      ).toHaveBeenCalledWith(
        'visitor-1',
        AlgorithmType.MIN_COUNT,
        VALID_WEIGHTS,
        42, // savedDomain.id
      );

      expect(result).toEqual(savedDomain);
    });

    it('가중치 합이 100이 아니면 저장 없이 에러가 발생해야 한다', async () => {
      const invalidWeights = [10, 10, 10, 10, 10, 10, 10]; // 합계 70

      await expect(
        service.setWeights(
          'visitor-1',
          AlgorithmType.MIN_COUNT,
          invalidWeights,
        ),
      ).rejects.toThrow('The sum of weights must be exactly 100.');

      expect(mockPersonalWeightRepository.create).not.toHaveBeenCalled();
      expect(
        mockReliabilityService.recalculateForUserAndAlgorithm,
      ).not.toHaveBeenCalled();
    });

    it('가중치 배열 크기가 7이 아니면 에러가 발생해야 한다', async () => {
      const shortWeights = [25, 25, 25, 25]; // 4개

      await expect(
        service.setWeights('visitor-1', AlgorithmType.MIN_COUNT, shortWeights),
      ).rejects.toThrow('Weights must contain exactly 7 values.');

      expect(mockPersonalWeightRepository.create).not.toHaveBeenCalled();
    });

    it('음수 가중치가 포함되면 에러가 발생해야 한다', async () => {
      const negativeWeights = [30, 25, 20, 15, 10, -5, 5]; // 합계 100이지만 음수 포함

      await expect(
        service.setWeights(
          'visitor-1',
          AlgorithmType.MIN_COUNT,
          negativeWeights,
        ),
      ).rejects.toThrow('Weights must be non-negative values.');

      expect(mockPersonalWeightRepository.create).not.toHaveBeenCalled();
    });

    it('가중치를 업데이트할 때 신뢰도 재계산이 새로운 personalWeightId로 실행되어야 한다', async () => {
      const newWeights = [30, 20, 15, 15, 10, 5, 5]; // 합계 100
      const updatedDomain = new DomainPersonalWeight(
        'visitor-1',
        AlgorithmType.MIN_COUNT,
        newWeights,
        42,
      );
      mockPersonalWeightRepository.create.mockResolvedValue(updatedDomain);

      await service.setWeights(
        'visitor-1',
        AlgorithmType.MIN_COUNT,
        newWeights,
      );

      expect(
        mockReliabilityService.recalculateForUserAndAlgorithm,
      ).toHaveBeenCalledWith(
        'visitor-1',
        AlgorithmType.MIN_COUNT,
        newWeights,
        42,
      );
    });
  });
});
