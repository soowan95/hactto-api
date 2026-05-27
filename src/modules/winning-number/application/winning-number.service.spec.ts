import { Test, TestingModule } from '@nestjs/testing';
import { WinningNumberService } from './winning-number.service';
import { WINNING_NUMBER_REPOSITORY_TOKEN } from '../domain/ports/winning-number.repository.interface';
import { WINNING_NUMBER_FETCHER_TOKEN } from '../domain/ports/winning-number-fetcher.interface';
import { DomainWinningNumber } from '../domain/entities/winning-number.entity';
import { WinningNumberDrawer } from '../domain/services/winning-number-drawer';

describe('WinningNumberService', () => {
  let service: WinningNumberService;
  let mockRepository: any;
  let mockFetcher: any;

  beforeEach(async () => {
    mockRepository = {
      findAll: jest.fn(),
      findByEpisode: jest.fn(),
      findLatestWithWinningNumber: jest.fn(),
      upsert: jest.fn(),
      createPlaceholder: jest.fn(),
    };

    mockFetcher = {
      fetchByEpisode: jest.fn(),
      fetchRecentOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WinningNumberService,
        {
          provide: WINNING_NUMBER_FETCHER_TOKEN,
          useValue: mockFetcher,
        },
        {
          provide: WINNING_NUMBER_REPOSITORY_TOKEN,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<WinningNumberService>(WinningNumberService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should delegate execution to repository', async () => {
      const mockResult = [
        new DomainWinningNumber(1, [1, 2, 3, 4, 5, 6, 7], true),
      ];
      mockRepository.findAll.mockResolvedValue(mockResult);

      const result = await service.findAll();

      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('findByEpisode', () => {
    it('should delegate execution to repository with episode', async () => {
      const episode = 100;
      const mockResult = new DomainWinningNumber(
        episode,
        [1, 2, 3, 4, 5, 6, 7],
        true,
      );
      mockRepository.findByEpisode.mockResolvedValue(mockResult);

      const result = await service.findByEpisode(episode);

      expect(mockRepository.findByEpisode).toHaveBeenCalledWith(episode);
      expect(result).toEqual(mockResult);
    });
  });

  describe('fetchRecentOne', () => {
    it('should fetch the latest winning number and save placeholders', async () => {
      mockFetcher.fetchRecentOne.mockResolvedValue({
        episode: 1000,
        numbers: [1, 2, 3, 4, 5, 6, 7],
      });

      const existingWinningNumber = WinningNumberDrawer.drawPlaceholder(1000);
      mockRepository.findByEpisode.mockResolvedValue(existingWinningNumber);

      await service.fetchRecentOne();

      expect(mockFetcher.fetchRecentOne).toHaveBeenCalled();

      const expectedWinningNumber = new DomainWinningNumber(
        1000,
        [1, 2, 3, 4, 5, 6, 7],
        true,
      );
      expect(mockRepository.upsert).toHaveBeenCalledWith(expectedWinningNumber);
      expect(mockRepository.upsert).toHaveBeenCalledWith(
        WinningNumberDrawer.drawPlaceholder(1001),
      );
    });
  });

  describe('fetch', () => {
    it('should fetch winning numbers batch and update db', async () => {
      mockFetcher.fetchByEpisode.mockImplementation((episode: number) => {
        if (episode === 11) {
          return Promise.resolve([
            {
              episode: 1,
              numbers: [1, 2, 3, 4, 5, 6, 7],
            },
          ]);
        } else if (episode === 15) {
          return Promise.resolve([
            {
              episode: 11,
              numbers: [11, 12, 13, 14, 15, 16, 17],
            },
          ]);
        }
        return Promise.resolve([]);
      });

      mockFetcher.fetchRecentOne.mockResolvedValue({
        episode: 15,
        numbers: [15, 16, 17, 18, 19, 20, 21],
      });

      const recentPlaceholder = WinningNumberDrawer.drawPlaceholder(15);
      mockRepository.findByEpisode.mockResolvedValue(recentPlaceholder);

      await service.fetch(15);

      expect(mockFetcher.fetchByEpisode).toHaveBeenCalledWith(11);
      expect(mockFetcher.fetchByEpisode).toHaveBeenCalledWith(15);
      expect(mockFetcher.fetchRecentOne).toHaveBeenCalled();

      const expectedWinningNumber1 = new DomainWinningNumber(
        1,
        [1, 2, 3, 4, 5, 6, 7],
        true,
      );
      const expectedWinningNumber2 = new DomainWinningNumber(
        11,
        [11, 12, 13, 14, 15, 16, 17],
        true,
      );
      const expectedWinningNumberRecent = new DomainWinningNumber(
        15,
        [15, 16, 17, 18, 19, 20, 21],
        true,
      );

      expect(mockRepository.upsert).toHaveBeenCalledWith(
        expectedWinningNumber1,
      );
      expect(mockRepository.upsert).toHaveBeenCalledWith(
        expectedWinningNumber2,
      );
      expect(mockRepository.upsert).toHaveBeenCalledWith(
        expectedWinningNumberRecent,
      );
      expect(mockRepository.upsert).toHaveBeenCalledWith(
        WinningNumberDrawer.drawPlaceholder(16),
      );
    });
  });
});
