import { Test, TestingModule } from '@nestjs/testing';
import { FetchWinningNumbersHandler } from './commands/fetch-winning-numbers/fetch-winning-numbers.handler';
import { FetchRecentWinningNumberHandler } from './commands/fetch-recent-winning-number/fetch-recent-winning-number.handler';
import { GetAllWinningNumbersHandler } from './queries/get-all-winning-numbers/get-all-winning-numbers.handler';
import { GetLatestWinningNumberHandler } from './queries/get-latest-winning-number/get-latest-winning-number.handler';
import { WINNING_NUMBER_REPOSITORY_TOKEN } from '../domain/ports/winning-number.repository.interface';
import { WINNING_NUMBER_FETCHER_TOKEN } from '../domain/ports/winning-number-fetcher.interface';
import { FetchWinningNumbersCommand } from './commands/fetch-winning-numbers/fetch-winning-numbers.command';
import { FetchRecentWinningNumberCommand } from './commands/fetch-recent-winning-number/fetch-recent-winning-number.command';
import { GetAllWinningNumbersQuery } from './queries/get-all-winning-numbers/get-all-winning-numbers.query';
import { GetLatestWinningNumberQuery } from './queries/get-latest-winning-number/get-latest-winning-number.query';
import { GetWinningNumberByEpisodeQuery } from './queries/get-winning-number-by-episode/get-winning-number-by-episode.query';
import { GetWinningNumberByEpisodeHandler } from './queries/get-winning-number-by-episode/get-winning-number-by-episode.handler';
import { DomainWinningNumber } from '../domain/entities/winning-number.entity';
import { WinningNumberDrawer } from '../domain/services/winning-number-drawer';
import { RedisService } from '../../../helpers/redis/redis.service';

describe('WinningNumber CQRS Handlers', () => {
  let fetchWinningNumbersHandler: FetchWinningNumbersHandler;
  let fetchRecentWinningNumberHandler: FetchRecentWinningNumberHandler;
  let getAllWinningNumbersHandler: GetAllWinningNumbersHandler;
  let getLatestWinningNumberHandler: GetLatestWinningNumberHandler;
  let getWinningNumberByEpisodeHandler: GetWinningNumberByEpisodeHandler;

  let mockRepository: any;
  let mockFetcher: any;
  let mockRedisService: any;

  beforeEach(async () => {
    mockRepository = {
      findAll: jest.fn(),
      findByEpisode: jest.fn(),
      findLatestWithWinningNumber: jest.fn(),
      upsert: jest.fn(),
    };

    mockFetcher = {
      fetchByEpisode: jest.fn(),
      fetchRecentOne: jest.fn(),
    };

    mockRedisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FetchWinningNumbersHandler,
        FetchRecentWinningNumberHandler,
        GetAllWinningNumbersHandler,
        GetLatestWinningNumberHandler,
        GetWinningNumberByEpisodeHandler,
        {
          provide: WINNING_NUMBER_REPOSITORY_TOKEN,
          useValue: mockRepository,
        },
        {
          provide: WINNING_NUMBER_FETCHER_TOKEN,
          useValue: mockFetcher,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    fetchWinningNumbersHandler = module.get<FetchWinningNumbersHandler>(
      FetchWinningNumbersHandler,
    );
    fetchRecentWinningNumberHandler =
      module.get<FetchRecentWinningNumberHandler>(
        FetchRecentWinningNumberHandler,
      );
    getAllWinningNumbersHandler = module.get<GetAllWinningNumbersHandler>(
      GetAllWinningNumbersHandler,
    );
    getLatestWinningNumberHandler = module.get<GetLatestWinningNumberHandler>(
      GetLatestWinningNumberHandler,
    );
    getWinningNumberByEpisodeHandler =
      module.get<GetWinningNumberByEpisodeHandler>(
        GetWinningNumberByEpisodeHandler,
      );
  });

  describe('FetchWinningNumbersHandler', () => {
    it('should fetch winning numbers and upsert them and clear cache', async () => {
      mockFetcher.fetchByEpisode.mockResolvedValue([
        { episode: 10, numbers: [1, 2, 3, 4, 5, 6, 7] },
      ]);
      mockFetcher.fetchRecentOne.mockResolvedValue({
        episode: 10,
        numbers: [1, 2, 3, 4, 5, 6, 7],
      });
      mockRepository.findByEpisode.mockResolvedValue(
        new DomainWinningNumber(10, [1, 2, 3, 4, 5, 6, 7], false),
      );

      const command = new FetchWinningNumbersCommand(10);
      await fetchWinningNumbersHandler.execute(command);

      expect(mockFetcher.fetchByEpisode).toHaveBeenCalled();
      expect(mockRepository.upsert).toHaveBeenCalled();
      expect(mockRedisService.del).toHaveBeenCalledWith('winning-number:all');
      expect(mockRedisService.del).toHaveBeenCalledWith(
        'winning-number:latest',
      );
    });
  });

  describe('FetchRecentWinningNumberHandler', () => {
    it('should fetch recent winning number and draw if not drawn and clear cache', async () => {
      mockFetcher.fetchRecentOne.mockResolvedValue({
        episode: 10,
        numbers: [1, 2, 3, 4, 5, 6, 7],
      });
      const placeholder = WinningNumberDrawer.drawPlaceholder(10);
      mockRepository.findByEpisode.mockResolvedValue(placeholder);

      const command = new FetchRecentWinningNumberCommand();
      await fetchRecentWinningNumberHandler.execute(command);

      expect(mockFetcher.fetchRecentOne).toHaveBeenCalled();
      expect(mockRepository.upsert).toHaveBeenCalled();
      expect(mockRedisService.del).toHaveBeenCalledWith('winning-number:all');
    });
  });

  describe('GetAllWinningNumbersHandler', () => {
    it('should return all winning numbers on cache miss and save to cache', async () => {
      const mockList = [
        new DomainWinningNumber(1, [1, 2, 3, 4, 5, 6, 7], true),
      ];
      mockRepository.findAll.mockResolvedValue(mockList);

      const query = new GetAllWinningNumbersQuery();
      const result = await getAllWinningNumbersHandler.execute(query);

      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockList);
      expect(mockRedisService.get).toHaveBeenCalledWith('winning-number:all');
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should return cached winning numbers on cache hit', async () => {
      const cached = [
        { id: 1, episode: 1, numbers: [1, 2, 3, 4, 5, 6, 7], isDrawn: true },
      ];
      mockRedisService.get.mockResolvedValue(JSON.stringify(cached));

      const query = new GetAllWinningNumbersQuery();
      const result = await getAllWinningNumbersHandler.execute(query);

      expect(result.length).toBe(1);
      expect(result[0].episode).toBe(1);
      expect(mockRepository.findAll).not.toHaveBeenCalled();
    });
  });

  describe('GetLatestWinningNumberHandler', () => {
    it('should return the latest winning number from db on cache miss and cache it', async () => {
      const mockVal = new DomainWinningNumber(1, [1, 2, 3, 4, 5, 6, 7], true);
      mockRepository.findLatestWithWinningNumber.mockResolvedValue(mockVal);

      const query = new GetLatestWinningNumberQuery();
      const result = await getLatestWinningNumberHandler.execute(query);

      expect(mockRepository.findLatestWithWinningNumber).toHaveBeenCalled();
      expect(result).toEqual(mockVal);
      expect(mockRedisService.get).toHaveBeenCalledWith(
        'winning-number:latest',
      );
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should return cached latest winning number on cache hit', async () => {
      const cached = {
        id: 1,
        episode: 1,
        numbers: [1, 2, 3, 4, 5, 6, 7],
        isDrawn: true,
      };
      mockRedisService.get.mockResolvedValue(JSON.stringify(cached));

      const query = new GetLatestWinningNumberQuery();
      const result = await getLatestWinningNumberHandler.execute(query);

      expect(result).toBeDefined();
      expect(result!.episode).toBe(1);
      expect(mockRepository.findLatestWithWinningNumber).not.toHaveBeenCalled();
    });
  });

  describe('GetWinningNumberByEpisodeHandler', () => {
    it('should return winning number by episode on cache miss and cache it', async () => {
      const mockVal = new DomainWinningNumber(5, [1, 2, 3, 4, 5, 6, 7], true);
      mockRepository.findByEpisode.mockResolvedValue(mockVal);

      const query = new GetWinningNumberByEpisodeQuery(5);
      const result = await getWinningNumberByEpisodeHandler.execute(query);

      expect(mockRepository.findByEpisode).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockVal);
      expect(mockRedisService.get).toHaveBeenCalledWith(
        'winning-number:episode:5',
      );
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should return cached winning number by episode on cache hit', async () => {
      const cached = {
        id: 1,
        episode: 5,
        numbers: [1, 2, 3, 4, 5, 6, 7],
        isDrawn: true,
      };
      mockRedisService.get.mockResolvedValue(JSON.stringify(cached));

      const query = new GetWinningNumberByEpisodeQuery(5);
      const result = await getWinningNumberByEpisodeHandler.execute(query);

      expect(result).toBeDefined();
      expect(result!.episode).toBe(5);
      expect(mockRepository.findByEpisode).not.toHaveBeenCalled();
    });
  });
});
