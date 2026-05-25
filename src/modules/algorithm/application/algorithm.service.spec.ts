import { Test, TestingModule } from '@nestjs/testing';
import { AlgorithmService } from './algorithm.service';
import { WINNING_NUMBER_REPOSITORY_TOKEN } from '../../winning-number/domain/ports/winning-number.repository.interface';
import { ALGORITHM_RESULT_REPOSITORY_TOKEN } from '../domain/ports/algorithm-result.repository.interface';
import { AlgorithmType, hacttoExecute } from '@hactto/algorithm';

jest.mock('@hactto/algorithm', () => {
  const original = jest.requireActual('@hactto/algorithm');
  return {
    ...original,
    hacttoExecute: jest.fn(),
  };
});

describe('AlgorithmService', () => {
  let service: AlgorithmService;
  let mockWinningNumberRepository: any;
  let mockAlgorithmResultRepository: any;

  beforeEach(async () => {
    mockWinningNumberRepository = {
      findAll: jest.fn(),
      findByEpisode: jest.fn(),
      findLatestWithWinningNumber: jest.fn(),
      upsert: jest.fn(),
      createPlaceholder: jest.fn(),
    };

    mockAlgorithmResultRepository = {
      create: jest.fn(),
      findWithoutReliability: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlgorithmService,
        {
          provide: WINNING_NUMBER_REPOSITORY_TOKEN,
          useValue: mockWinningNumberRepository,
        },
        {
          provide: ALGORITHM_RESULT_REPOSITORY_TOKEN,
          useValue: mockAlgorithmResultRepository,
        },
      ],
    }).compile();

    service = module.get<AlgorithmService>(AlgorithmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('allAlgorithmTypes', () => {
    it('should return all algorithm types', () => {
      const types = service.allAlgorithmTypes();
      expect(types).toContain(AlgorithmType.MIN_COUNT);
      expect(types).toContain(AlgorithmType.TOTAL_MIN_COUNT);
    });
  });

  describe('initialize', () => {
    it('should run algorithms for historical data batches', async () => {
      const mockNumbers = [
        { getNumberArray: () => [1, 2, 3, 4, 5, 6, 7] },
        { getNumberArray: () => [11, 12, 13, 14, 15, 16, 17] },
        { getNumberArray: () => [21, 22, 23, 24, 25, 26, 27] },
      ] as any;

      mockWinningNumberRepository.findAll.mockResolvedValue(mockNumbers);
      const mockPrediction = [1, 2, 3, 4, 5, 6, 7];
      (hacttoExecute as jest.Mock).mockResolvedValue(mockPrediction);
      mockAlgorithmResultRepository.create.mockResolvedValue({ id: 1 });

      await service.initialize();

      expect(mockWinningNumberRepository.findAll).toHaveBeenCalled();
      // Loop: for (let i = 1; i < data.length; i++) -> i = 1, i = 2 (2 iterations)
      // For each algorithm type (MIN_COUNT, TOTAL_MIN_COUNT) -> total 4 executions.
      expect(hacttoExecute).toHaveBeenCalledTimes(4);
      expect(mockAlgorithmResultRepository.create).toHaveBeenCalledTimes(4);
    });
  });

  describe('generate', () => {
    it('should run specific algorithm on latest numbers and store predictions', async () => {
      const mockNumbers = [
        { getNumberArray: () => [1, 2, 3, 4, 5, 6, 7] },
      ] as any;
      const latestNumber = { episode: 10 } as any;

      mockWinningNumberRepository.findAll.mockResolvedValue(mockNumbers);
      mockWinningNumberRepository.findLatestWithWinningNumber.mockResolvedValue(
        latestNumber,
      );

      const mockPrediction = [10, 11, 12, 13, 14, 15, 16];
      (hacttoExecute as jest.Mock).mockResolvedValue(mockPrediction);
      mockAlgorithmResultRepository.create.mockResolvedValue({
        id: 100,
      } as any);

      const result = await service.generate(AlgorithmType.MIN_COUNT);

      expect(mockWinningNumberRepository.findAll).toHaveBeenCalled();
      expect(
        mockWinningNumberRepository.findLatestWithWinningNumber,
      ).toHaveBeenCalled();
      expect(hacttoExecute).toHaveBeenCalledWith(AlgorithmType.MIN_COUNT, [
        [1, 2, 3, 4, 5, 6, 7],
      ]);
      expect(mockAlgorithmResultRepository.create).toHaveBeenCalledWith({
        algorithm: AlgorithmType.MIN_COUNT,
        episode: 11,
        first: 10,
        second: 11,
        third: 12,
        fourth: 13,
        fifth: 14,
        sixth: 15,
        bonus: 16,
      });
      expect(result).toEqual({ id: 100 });
    });
  });
});
