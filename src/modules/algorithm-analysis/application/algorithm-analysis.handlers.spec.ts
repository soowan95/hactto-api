import { Test, TestingModule } from '@nestjs/testing';
import { SetPersonalWeightHandler } from './commands/set-personal-weight/set-personal-weight.handler';
import { GeneratePredictionHandler } from './commands/generate-prediction/generate-prediction.handler';
import { AnalyzeReliabilityHandler } from './commands/analyze-reliability/analyze-reliability.handler';
import { GetPredictionHistoryHandler } from './queries/get-prediction-history/get-prediction-history.handler';
import { GetPersonalWeightHandler } from './queries/get-personal-weight/get-personal-weight.handler';
import { GetAverageReliabilityHandler } from './queries/get-average-reliability/get-average-reliability.handler';
import { ALGORITHM_ANALYSIS_REPOSITORY_TOKEN } from '../domain/ports/algorithm-analysis.repository.interface';
import { WINNING_NUMBER_REPOSITORY_TOKEN } from '../../winning-number/domain/ports/winning-number.repository.interface';
import { AlgorithmType } from '@hactto/algorithm';
import { DomainPrediction } from '../domain/aggregates/prediction.entity';
import { DomainWinningNumber } from '../../winning-number/domain/entities/winning-number.entity';
import { SetPersonalWeightCommand } from './commands/set-personal-weight/set-personal-weight.command';
import { GeneratePredictionCommand } from './commands/generate-prediction/generate-prediction.command';
import { AnalyzeReliabilityCommand } from './commands/analyze-reliability/analyze-reliability.command';
import { GetPredictionHistoryQuery } from './queries/get-prediction-history/get-prediction-history.query';
import { GetPersonalWeightQuery } from './queries/get-personal-weight/get-personal-weight.query';
import { GetAverageReliabilityQuery } from './queries/get-average-reliability/get-average-reliability.query';
import { RedisService } from '../../../helpers/redis/redis.service';

describe('AlgorithmAnalysis CQRS Handlers', () => {
  let setPersonalWeightHandler: SetPersonalWeightHandler;
  let generatePredictionHandler: GeneratePredictionHandler;
  let analyzeReliabilityHandler: AnalyzeReliabilityHandler;
  let getPredictionHistoryHandler: GetPredictionHistoryHandler;
  let getPersonalWeightHandler: GetPersonalWeightHandler;
  let getAverageReliabilityHandler: GetAverageReliabilityHandler;

  let mockAlgorithmAnalysisRepository: any;
  let mockWinningNumberRepository: any;
  let mockRedisService: any;

  beforeEach(async () => {
    mockAlgorithmAnalysisRepository = {
      create: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      findByUser: jest.fn().mockResolvedValue([]),
      findWithoutReliability: jest.fn().mockResolvedValue([]),
      count: jest.fn(),
      getAverageScore: jest.fn(),
    };

    mockWinningNumberRepository = {
      findAll: jest.fn().mockResolvedValue([]),
      findByEpisode: jest.fn(),
      findLatestWithWinningNumber: jest.fn(),
    };

    mockRedisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SetPersonalWeightHandler,
        GeneratePredictionHandler,
        AnalyzeReliabilityHandler,
        GetPredictionHistoryHandler,
        GetPersonalWeightHandler,
        GetAverageReliabilityHandler,
        {
          provide: ALGORITHM_ANALYSIS_REPOSITORY_TOKEN,
          useValue: mockAlgorithmAnalysisRepository,
        },
        {
          provide: WINNING_NUMBER_REPOSITORY_TOKEN,
          useValue: mockWinningNumberRepository,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    setPersonalWeightHandler = module.get<SetPersonalWeightHandler>(
      SetPersonalWeightHandler,
    );
    generatePredictionHandler = module.get<GeneratePredictionHandler>(
      GeneratePredictionHandler,
    );
    analyzeReliabilityHandler = module.get<AnalyzeReliabilityHandler>(
      AnalyzeReliabilityHandler,
    );
    getPredictionHistoryHandler = module.get<GetPredictionHistoryHandler>(
      GetPredictionHistoryHandler,
    );
    getPersonalWeightHandler = module.get<GetPersonalWeightHandler>(
      GetPersonalWeightHandler,
    );
    getAverageReliabilityHandler = module.get<GetAverageReliabilityHandler>(
      GetAverageReliabilityHandler,
    );
  });

  describe('SetPersonalWeightHandler', () => {
    it('should save personal weight and invalidate cache', async () => {
      const command = new SetPersonalWeightCommand(
        'user-1',
        AlgorithmType.MIN_COUNT,
        [25, 20, 15, 15, 10, 10, 5],
      );
      await setPersonalWeightHandler.execute(command);

      expect(mockRedisService.del).toHaveBeenCalledWith(
        'user:user-1:algorithm:MIN_COUNT:weights',
      );
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'user:user-1:algorithm:MIN_COUNT:weights',
        JSON.stringify([25, 20, 15, 15, 10, 10, 5]),
      );
    });
  });

  describe('GeneratePredictionHandler', () => {
    it('should generate next episode prediction and save it and clear cache', async () => {
      const latestWn = new DomainWinningNumber(
        100,
        [1, 2, 3, 4, 5, 6, 7],
        true,
      );
      mockWinningNumberRepository.findLatestWithWinningNumber.mockResolvedValue(
        latestWn,
      );
      mockWinningNumberRepository.findAll.mockResolvedValue([latestWn]);

      const prediction = new DomainPrediction(
        AlgorithmType.MIN_COUNT,
        101,
        [25, 20, 15, 15, 10, 10, 5],
        [1, 2, 3, 4, 5, 6, 7],
      );
      mockAlgorithmAnalysisRepository.create.mockResolvedValue(prediction);

      const command = new GeneratePredictionCommand(
        AlgorithmType.MIN_COUNT,
        'user-1',
      );
      const result = await generatePredictionHandler.execute(command);

      expect(result).toBeDefined();
      expect(mockAlgorithmAnalysisRepository.create).toHaveBeenCalled();
      expect(mockRedisService.del).toHaveBeenCalledWith(
        'user:user-1:predictions:history',
      );
    });
  });

  describe('AnalyzeReliabilityHandler', () => {
    it('should calculate reliability for prediction with no score and clear cache', async () => {
      mockAlgorithmAnalysisRepository.count.mockResolvedValue(1);

      const prediction = new DomainPrediction(
        AlgorithmType.MIN_COUNT,
        100,
        [25, 20, 15, 15, 10, 10, 5],
        [1, 2, 3, 4, 5, 6, 7],
        5,
        'user-1',
      );
      mockAlgorithmAnalysisRepository.findWithoutReliability.mockResolvedValue([
        prediction,
      ]);

      const mockWn = new DomainWinningNumber(100, [1, 2, 3, 4, 5, 6, 7], true);
      mockWinningNumberRepository.findByEpisode.mockResolvedValue(mockWn);

      const command = new AnalyzeReliabilityCommand();
      await analyzeReliabilityHandler.execute(command);

      expect(mockAlgorithmAnalysisRepository.saveMany).toHaveBeenCalledWith([
        prediction,
      ]);
      expect(mockRedisService.del).toHaveBeenCalledWith(
        'algorithm:all:average-reliability',
      );
    });
  });

  describe('GetPredictionHistoryHandler', () => {
    it('should retrieve prediction history from db on cache miss and save to cache', async () => {
      const prediction = new DomainPrediction(
        AlgorithmType.MIN_COUNT,
        100,
        [25, 20, 15, 15, 10, 10, 5],
        [1, 2, 3, 4, 5, 6, 7],
        5,
        'user-1',
      );
      mockAlgorithmAnalysisRepository.findByUser.mockResolvedValue([
        prediction,
      ]);

      const mockWn = new DomainWinningNumber(100, [1, 2, 3, 4, 5, 6, 7], true);
      mockWinningNumberRepository.findAll.mockResolvedValue([mockWn]);

      const query = new GetPredictionHistoryQuery('user-1');
      const result = await getPredictionHistoryHandler.execute(query);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe(prediction.id);
      expect(mockRedisService.get).toHaveBeenCalledWith(
        'user:user-1:predictions:history',
      );
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should return cached prediction history on cache hit', async () => {
      const cached = [
        {
          id: 5,
          algorithm: 'MIN_COUNT',
          episode: 100,
          numbers: [1, 2, 3, 4, 5, 6, 7],
          matchResult: null,
        },
      ];
      mockRedisService.get.mockResolvedValue(JSON.stringify(cached));

      const query = new GetPredictionHistoryQuery('user-1');
      const result = await getPredictionHistoryHandler.execute(query);

      expect(result).toEqual(cached);
      expect(mockAlgorithmAnalysisRepository.findByUser).not.toHaveBeenCalled();
    });
  });

  describe('GetPersonalWeightHandler', () => {
    it('should return default weights on cache miss and set cache', async () => {
      const query = new GetPersonalWeightQuery(
        'user-1',
        AlgorithmType.MIN_COUNT,
      );
      const result = await getPersonalWeightHandler.execute(query);

      expect(result).toEqual([25, 20, 15, 15, 10, 10, 5]);
      expect(mockRedisService.get).toHaveBeenCalledWith(
        'user:user-1:algorithm:MIN_COUNT:weights',
      );
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'user:user-1:algorithm:MIN_COUNT:weights',
        JSON.stringify([25, 20, 15, 15, 10, 10, 5]),
      );
    });

    it('should return cached weights on cache hit', async () => {
      const cached = [25, 20, 15, 15, 10, 10, 5];
      mockRedisService.get.mockResolvedValue(JSON.stringify(cached));

      const query = new GetPersonalWeightQuery(
        'user-1',
        AlgorithmType.MIN_COUNT,
      );
      const result = await getPersonalWeightHandler.execute(query);

      expect(result).toEqual(cached);
    });
  });

  describe('GetAverageReliabilityHandler', () => {
    it('should retrieve average reliability score from db and cache it', async () => {
      mockAlgorithmAnalysisRepository.getAverageScore.mockResolvedValue(85.5);

      const query = new GetAverageReliabilityQuery(AlgorithmType.MIN_COUNT);
      const result = await getAverageReliabilityHandler.execute(query);

      expect(result).toBe(85.5);
      expect(mockRedisService.get).toHaveBeenCalledWith(
        'algorithm:MIN_COUNT:average-reliability',
      );
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should return cached average reliability score on cache hit', async () => {
      mockRedisService.get.mockResolvedValue('92.3');

      const query = new GetAverageReliabilityQuery(AlgorithmType.MIN_COUNT);
      const result = await getAverageReliabilityHandler.execute(query);

      expect(result).toBe(92.3);
      expect(
        mockAlgorithmAnalysisRepository.getAverageScore,
      ).not.toHaveBeenCalled();
    });
  });
});
