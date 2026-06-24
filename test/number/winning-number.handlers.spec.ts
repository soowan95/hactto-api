import { Test, TestingModule } from '@nestjs/testing';
import { FetchWinningNumbersHandler } from '../../src/modules/number/application/command-handlers/fetch-winning-numbers.handler';
import { FetchRecentWinningNumberHandler } from '../../src/modules/number/application/command-handlers/fetch-recent-winning-number.handler';
import { GetAllWinningNumbersHandler } from '../../src/modules/number/application/query-handlers/get-all-winning-numbers.handler';
import { GetLatestWinningNumberHandler } from '../../src/modules/number/application/query-handlers/get-latest-winning-number.handler';
import { WINNING_NUMBER_REPOSITORY_TOKEN } from '../../src/modules/number/domain/ports/winning-number.port';
import { WINNING_NUMBER_FETCHER_TOKEN } from '../../src/modules/number/domain/ports/winning-number-fetcher.port';
import { FetchWinningNumbersCommand } from '../../src/modules/number/application/commands/fetch-winning-numbers.command';
import { FetchRecentWinningNumberCommand } from '../../src/modules/number/application/commands/fetch-recent-winning-number.command';
import { GetAllWinningNumbersQuery } from '../../src/modules/number/application/queries/get-all-winning-numbers.query';
import { GetLatestWinningNumberQuery } from '../../src/modules/number/application/queries/get-latest-winning-number.query';
import { GetWinningNumberByEpisodeQuery } from '../../src/modules/number/application/queries/get-winning-number-by-episode.query';
import { GetWinningNumberByEpisodeHandler } from '../../src/modules/number/application/query-handlers/get-winning-number-by-episode.handler';
import { DomainWinningNumber } from '../../src/modules/number/domain/aggregates/winning-number.entity';
import { WinningNumberDrawer } from '../../src/modules/number/domain/services/winning-number-drawer';
import { RedisService } from '../../src/helpers/redis/application/redis.service';
import { EventPublisher, QueryBus } from '@nestjs/cqrs';

describe('WinningNumber CQRS Handlers', () => {
  let fetchWinningNumbersHandler: FetchWinningNumbersHandler;
  let fetchRecentWinningNumberHandler: FetchRecentWinningNumberHandler;
  let getAllWinningNumbersHandler: GetAllWinningNumbersHandler;
  let getLatestWinningNumberHandler: GetLatestWinningNumberHandler;
  let getWinningNumberByEpisodeHandler: GetWinningNumberByEpisodeHandler;

  let mockRepository: any;
  let mockFetcher: any;
  let mockRedisService: any;
  let mockEventPublisher: any;
  let mockQueryBus: any;

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

    mockEventPublisher = {
      mergeObjectContext: jest.fn().mockImplementation((entity) => {
        entity.commit = jest.fn();
        return entity;
      }),
    };

    mockQueryBus = {
      execute: jest.fn().mockResolvedValue({ status: 'HOT' }),
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
        {
          provide: EventPublisher,
          useValue: mockEventPublisher,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
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
    it('should draw if a new episode is found and return success status', async () => {
      mockFetcher.fetchRecentOne.mockResolvedValue({
        episode: 10,
        numbers: [1, 2, 3, 4, 5, 6, 7],
      });
      mockRepository.findLatestWithWinningNumber.mockResolvedValue(
        new DomainWinningNumber(9, [1, 2, 3, 4, 5, 6, 7], true),
      );
      const placeholder = WinningNumberDrawer.drawPlaceholder(10);
      placeholder.commit = jest.fn(); // Spy on commit
      mockRepository.findByEpisode.mockResolvedValue(placeholder);

      const command = new FetchRecentWinningNumberCommand();
      const result = await fetchRecentWinningNumberHandler.execute(command);

      expect(mockFetcher.fetchRecentOne).toHaveBeenCalled();
      expect(mockRepository.findLatestWithWinningNumber).toHaveBeenCalled();
      expect(mockRepository.upsert).toHaveBeenCalled();
      expect(placeholder.commit).toHaveBeenCalled();
      expect(result).toEqual({ status: 'success', episode: 10 });
    });

    it('should return waiting_new_episode status if the API returned an old episode', async () => {
      mockFetcher.fetchRecentOne.mockResolvedValue({
        episode: 9,
        numbers: [1, 2, 3, 4, 5, 6, 7],
      });
      mockRepository.findLatestWithWinningNumber.mockResolvedValue(
        new DomainWinningNumber(9, [1, 2, 3, 4, 5, 6, 7], true),
      );

      const command = new FetchRecentWinningNumberCommand();
      const result = await fetchRecentWinningNumberHandler.execute(command);

      expect(mockFetcher.fetchRecentOne).toHaveBeenCalled();
      expect(mockRepository.findLatestWithWinningNumber).toHaveBeenCalled();
      expect(mockRepository.upsert).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'waiting_new_episode', episode: 9 });
    });

    it('should return already_drawn status if the episode is already drawn', async () => {
      mockFetcher.fetchRecentOne.mockResolvedValue({
        episode: 10,
        numbers: [1, 2, 3, 4, 5, 6, 7],
      });
      mockRepository.findLatestWithWinningNumber.mockResolvedValue(
        new DomainWinningNumber(9, [1, 2, 3, 4, 5, 6, 7], true),
      );
      const alreadyDrawn = new DomainWinningNumber(
        10,
        [1, 2, 3, 4, 5, 6, 7],
        true,
      );
      mockRepository.findByEpisode.mockResolvedValue(alreadyDrawn);

      const command = new FetchRecentWinningNumberCommand();
      const result = await fetchRecentWinningNumberHandler.execute(command);

      expect(mockFetcher.fetchRecentOne).toHaveBeenCalled();
      expect(mockRepository.findLatestWithWinningNumber).toHaveBeenCalled();
      expect(mockRepository.upsert).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'already_drawn', episode: 10 });
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
