import { Test, TestingModule } from '@nestjs/testing';
import { AlgorithmController } from '../../src/modules/lottery-analysis/presentation/algorithm.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetAlgorithmTypeQuery } from '../../src/modules/lottery-analysis/application/queries/get-algorithm-type.query';
import { GetPredictionHistoryQuery } from '../../src/modules/lottery-analysis/application/queries/get-prediction-history.query';
import { GeneratePredictionCommand } from '../../src/modules/lottery-analysis/application/commands/generate-prediction.command';
import { RedisService } from '../../src/helpers/redis/application/redis.service';

describe('AlgorithmController', () => {
  let controller: AlgorithmController;
  let mockCommandBus: jest.Mocked<CommandBus>;
  let mockQueryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    mockCommandBus = {
      execute: jest.fn(),
    } as any;

    mockQueryBus = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlgorithmController],
      providers: [
        { provide: CommandBus, useValue: mockCommandBus },
        { provide: QueryBus, useValue: mockQueryBus },
        {
          provide: RedisService,
          useValue: {
            validateMasterKey: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AlgorithmController>(AlgorithmController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllAlgorithmTypes', () => {
    it('should return algorithm types list', async () => {
      const mockResult = [{ type: 'MIN_COUNT', name: '자리별 냉번호' }];
      mockQueryBus.execute.mockResolvedValue(mockResult);

      const response = await controller.getAllAlgorithmTypes();

      expect(response).toBeDefined();
      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        expect.any(GetAlgorithmTypeQuery),
      );
    });
  });

  describe('getHistory', () => {
    it('should return prediction history', async () => {
      const mockHistory = [{ id: 'pred-1', numbers: [1, 2, 3, 4, 5, 6] }];
      mockQueryBus.execute.mockResolvedValue(mockHistory);

      const response = await controller.getHistory('visitor-1');

      expect(response).toBeDefined();
      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        expect.any(GetPredictionHistoryQuery),
      );
    });
  });

  describe('generatePrediction', () => {
    it('should execute command and return prediction result', async () => {
      const mockGenerated = {
        getNumberArray: () => [1, 2, 3, 4, 5, 6],
        analysis: {
          id: 123,
          getReliability: () => 95,
          sum: 21,
          cnt0s: 6,
          cnt10s: 0,
          cnt20s: 0,
          cnt30s: 0,
          cnt40s: 0,
          sumLastDigits: 21,
          lastDigit0: '[]',
          lastDigit1: '[]',
          lastDigit2: '[]',
          lastDigit3: '[]',
          lastDigit4: '[]',
          lastDigit5: '[]',
          lastDigit6: '[]',
          lastDigit7: '[]',
          lastDigit8: '[]',
          lastDigit9: '[]',
          even: 3,
          odd: 3,
          hot: 4,
          warm: 1,
          cold: 1,
          low: 3,
          high: 3,
          ac: 0,
          consecutive: '[]',
          temperatures: '{}',
        },
      };
      mockCommandBus.execute.mockResolvedValue(mockGenerated);

      const response = await controller.generatePrediction(
        'MIN_COUNT',
        { weights: [1, 2, 3], oddCount: 3 },
        'visitor-1',
      );

      expect(response).toBeDefined();
      expect(response.numbers).toEqual([1, 2, 3, 4, 5, 6]);
      expect(response.analysis?.reliability).toBe(95);
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        expect.any(GeneratePredictionCommand),
      );
    });
  });
});
