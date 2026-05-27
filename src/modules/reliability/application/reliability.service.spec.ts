import { Test, TestingModule } from '@nestjs/testing';
import { ReliabilityService } from './reliability.service';
import { AlgorithmService } from '../../algorithm/application/algorithm.service';
import { WINNING_NUMBER_REPOSITORY_TOKEN } from '../../winning-number/domain/ports/winning-number.repository.interface';
import { ALGORITHM_RESULT_REPOSITORY_TOKEN } from '../../algorithm/domain/ports/algorithm-result.repository.interface';
import { RELIABILITY_REPOSITORY_TOKEN } from '../domain/ports/reliability.repository.interface';
import { AlgorithmType } from '@hactto/algorithm';
import { DomainAlgorithmResult } from '../../algorithm/domain/entities/algorithm-result.entity';
import { DomainWinningNumber } from '../../winning-number/domain/entities/winning-number.entity';
import { DomainReliability } from '../domain/entities/reliability.entity';
import { WinningNumberDrawer } from '../../winning-number/domain/services/winning-number-drawer';

import { PersonalWeightService } from '../../personal-weight/application/personal-weight.service';

describe('ReliabilityService', () => {
  let service: ReliabilityService;
  let mockAlgorithmService: any;
  let mockWinningNumberRepository: any;
  let mockAlgorithmResultRepository: any;
  let mockReliabilityRepository: any;
  let mockPersonalWeightService: any;

  beforeEach(async () => {
    mockAlgorithmService = {
      initialize: jest.fn(),
    };

    mockWinningNumberRepository = {
      findByEpisode: jest.fn(),
    };

    mockAlgorithmResultRepository = {
      count: jest.fn(),
      findWithoutReliability: jest.fn(),
      updatePersonalWeight: jest.fn().mockResolvedValue(undefined),
      findByUser: jest.fn().mockResolvedValue([]),
    };

    mockReliabilityRepository = {
      createMany: jest.fn(),
      getAverageScore: jest.fn(),
      upsert: jest.fn(),
    };

    mockPersonalWeightService = {
      getWeights: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReliabilityService,
        {
          provide: AlgorithmService,
          useValue: mockAlgorithmService,
        },
        {
          provide: WINNING_NUMBER_REPOSITORY_TOKEN,
          useValue: mockWinningNumberRepository,
        },
        {
          provide: ALGORITHM_RESULT_REPOSITORY_TOKEN,
          useValue: mockAlgorithmResultRepository,
        },
        {
          provide: RELIABILITY_REPOSITORY_TOKEN,
          useValue: mockReliabilityRepository,
        },
        {
          provide: PersonalWeightService,
          useValue: mockPersonalWeightService,
        },
      ],
    }).compile();

    service = module.get<ReliabilityService>(ReliabilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyze', () => {
    it('should initialize algorithms if no predictions exist', async () => {
      mockAlgorithmResultRepository.count.mockResolvedValue(0);
      mockAlgorithmResultRepository.findWithoutReliability.mockResolvedValue(
        [],
      );

      await service.analyze();

      expect(mockAlgorithmService.initialize).toHaveBeenCalled();
    });

    it('should calculate reliability for targets and save results', async () => {
      mockAlgorithmResultRepository.count.mockResolvedValue(10);

      const mockResult = new DomainAlgorithmResult(
        AlgorithmType.MIN_COUNT,
        100,
        [1, 2, 3, 4, 5, 6, 7],
        5,
      );
      mockAlgorithmResultRepository.findWithoutReliability.mockResolvedValue([
        mockResult,
      ]);

      const mockWinningNumber = new DomainWinningNumber(
        100,
        [1, 2, 3, 4, 5, 6, 7],
        true,
      );
      mockWinningNumberRepository.findByEpisode.mockResolvedValue(
        mockWinningNumber,
      );

      await service.analyze();

      expect(mockAlgorithmService.initialize).not.toHaveBeenCalled();
      expect(mockWinningNumberRepository.findByEpisode).toHaveBeenCalledWith(
        100,
      );

      // Since it's a perfect match, reliability score should be 100.
      expect(mockReliabilityRepository.createMany).toHaveBeenCalledWith([
        new DomainReliability(5, 100),
      ]);
    });

    it('should skip calculation if winning number is all zeros (placeholder)', async () => {
      mockAlgorithmResultRepository.count.mockResolvedValue(10);

      const mockResult = new DomainAlgorithmResult(
        AlgorithmType.MIN_COUNT,
        100,
        [1, 2, 3, 4, 5, 6, 7],
        5,
      );
      mockAlgorithmResultRepository.findWithoutReliability.mockResolvedValue([
        mockResult,
      ]);

      const mockWinningNumber = WinningNumberDrawer.drawPlaceholder(100);
      mockWinningNumberRepository.findByEpisode.mockResolvedValue(
        mockWinningNumber,
      );

      await service.analyze();

      expect(mockReliabilityRepository.createMany).not.toHaveBeenCalled();
    });
  });

  describe('getAverageScore', () => {
    it('should fetch average reliability score for specific algorithm', async () => {
      mockReliabilityRepository.getAverageScore.mockResolvedValue(75.5);

      const result = await service.getAverageScore(AlgorithmType.MIN_COUNT);

      expect(mockReliabilityRepository.getAverageScore).toHaveBeenCalledWith(
        AlgorithmType.MIN_COUNT,
      );
      expect(result).toEqual(75.5);
    });
  });
});
