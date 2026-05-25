import { Test, TestingModule } from '@nestjs/testing';
import { WinningNumberService } from './winning-number.service';
import { HttpService } from '@nestjs/axios';
import { WINNING_NUMBER_REPOSITORY_TOKEN } from '../domain/ports/winning-number.repository.interface';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { Lt365 } from '../presentation/dtos/responses/lt365-response.dto';

describe('WinningNumberService', () => {
  let service: WinningNumberService;
  let mockRepository: any;
  let mockHttpService: any;

  beforeEach(async () => {
    mockRepository = {
      findAll: jest.fn(),
      findByEpisode: jest.fn(),
      findLatestWithWinningNumber: jest.fn(),
      upsert: jest.fn(),
      createPlaceholder: jest.fn(),
    };

    mockHttpService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WinningNumberService,
        {
          provide: HttpService,
          useValue: mockHttpService,
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
      const mockResult = [{ id: 1, episode: 1 }] as any;
      mockRepository.findAll.mockResolvedValue(mockResult);

      const result = await service.findAll();

      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('findByEpisode', () => {
    it('should delegate execution to repository with episode', async () => {
      const episode = 100;
      const mockResult = { id: 1, episode } as any;
      mockRepository.findByEpisode.mockResolvedValue(mockResult);

      const result = await service.findByEpisode(episode);

      expect(mockRepository.findByEpisode).toHaveBeenCalledWith(episode);
      expect(result).toEqual(mockResult);
    });
  });

  describe('fetchRecentOne', () => {
    it('should fetch the latest winning number and save placeholders', async () => {
      const mockLt365: Lt365 = {
        ltEpsd: 1000,
        tm1WnNo: 1,
        tm2WnNo: 2,
        tm3WnNo: 3,
        tm4WnNo: 4,
        tm5WnNo: 5,
        tm6WnNo: 6,
        bnsWnNo: 7,
      } as any;

      const response: AxiosResponse = {
        data: {
          data: {
            list: [mockLt365],
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(response));

      await service.fetchRecentOne();

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do',
      );
      expect(mockRepository.upsert).toHaveBeenCalledWith(mockLt365);
      expect(mockRepository.createPlaceholder).toHaveBeenCalledWith(1001);
    });
  });

  describe('fetch', () => {
    it('should fetch winning numbers batch and update db', async () => {
      const mockLt365List1: Lt365[] = [{ ltEpsd: 1, tm1WnNo: 1 } as any];
      const mockLt365List2: Lt365[] = [{ ltEpsd: 11, tm1WnNo: 11 } as any];
      const mockLt365ListRecent: Lt365[] = [{ ltEpsd: 15, tm1WnNo: 15 } as any];

      // mock responses for step i = 11, then recent list, and fetchRecentOne at the end
      mockHttpService.get.mockImplementation((url: string) => {
        let list: Lt365[] = [];
        if (url.includes('srchCursorLtEpsd=11')) {
          list = mockLt365List1;
        } else if (url.includes('srchCursorLtEpsd=15')) {
          // step 2: lastestEpisode call
          list = mockLt365List2;
        } else if (url.includes('selectPstLt645Info.do')) {
          // step 3: fetchRecentOne call
          list = mockLt365ListRecent;
        }
        return of({
          data: {
            // pop() in fetchRecentOne modifies the array. We clone list here to prevent mutation.
            data: { list: [...list] },
          },
        } as AxiosResponse);
      });

      const expectedLt365_1 = mockLt365List1[0];
      const expectedLt365_2 = mockLt365List2[0];
      const expectedLt365_3 = mockLt365ListRecent[0];

      await service.fetch(15);

      // Loop: for (let i = 11; i < lastestEpisode; i = i + 10)
      // Since lastestEpisode = 15, the loop runs for i = 11.
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('srchCursorLtEpsd=11'),
      );
      // Calls the recent 10 episodes
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('srchCursorLtEpsd=15'),
      );
      // Then fetchRecentOne
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do',
      );

      expect(mockRepository.upsert).toHaveBeenCalledWith(expectedLt365_1);
      expect(mockRepository.upsert).toHaveBeenCalledWith(expectedLt365_2);
      expect(mockRepository.upsert).toHaveBeenCalledWith(expectedLt365_3);
      expect(mockRepository.createPlaceholder).toHaveBeenCalledWith(16);
    });
  });
});
