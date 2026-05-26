import { Inject, Injectable } from '@nestjs/common';
import { WinningNumber } from '../domain/entities/winning-number.entity';
import {
  IWinningNumberRepository,
  WINNING_NUMBER_REPOSITORY_TOKEN,
} from '../domain/ports/winning-number.repository.interface';
import {
  IWinningNumberFetcher,
  WINNING_NUMBER_FETCHER_TOKEN,
  ExternalLotteryData,
} from '../domain/ports/winning-number-fetcher.interface';
import { plainToInstance } from 'class-transformer';
import { WinningNumberShowResponseDto } from './dtos/winning-number-show-response.dto';

@Injectable()
export class WinningNumberService {
  constructor(
    @Inject(WINNING_NUMBER_FETCHER_TOKEN)
    private readonly winningNumberFetcher: IWinningNumberFetcher,
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly winningNumberRepository: IWinningNumberRepository,
  ) {}

  async fetch(lastestEpisode: number): Promise<void> {
    const dataMap = new Map<number, ExternalLotteryData>();

    // From the 1st episode to the nearest multiple of 10 to the most recent episode.
    for (let i = 11; i < lastestEpisode; i = i + 10) {
      const list = await this.winningNumberFetcher.fetchByEpisode(i);
      for (const data of list) {
        dataMap.set(data.episode, data);
      }
    }

    // The last 10 episodes, excluding the most recent one.
    const list = await this.winningNumberFetcher.fetchByEpisode(lastestEpisode);
    for (const data of list) {
      dataMap.set(data.episode, data);
    }

    const dataList = Array.from(dataMap.values());

    for (const data of dataList) {
      const winningNumber = new WinningNumber(data.episode, data.numbers, true);
      await this.winningNumberRepository.upsert(winningNumber);
    }

    await this.fetchRecentOne();
  }

  async fetchRecentOne(): Promise<void> {
    const data = await this.winningNumberFetcher.fetchRecentOne();
    const winningNumber = await this.winningNumberRepository.findByEpisode(
      data.episode,
    );
    winningNumber.draw(data.numbers);
    await this.winningNumberRepository.upsert(winningNumber);
    await this.winningNumberRepository.createPlaceholder(
      WinningNumber.placeholder(data.episode + 1),
    );
  }

  /**
   * Find all winning numbers from the WINNING_NUMBER table.
   */
  async findAll(options?: any): Promise<WinningNumberShowResponseDto[]> {
    const entities: WinningNumber[] =
      await this.winningNumberRepository.findAll(options);
    return plainToInstance(
      WinningNumberShowResponseDto,
      entities.map((entity) => ({
        episode: entity.episode,
        numbers: entity.getNumberArray(),
      })),
    );
  }

  /**
   * Find one winning number from the WINNING_NUMBER table by episode.
   */
  async findByEpisode(episode: number): Promise<WinningNumberShowResponseDto> {
    const entity = await this.winningNumberRepository.findByEpisode(episode);
    return plainToInstance(WinningNumberShowResponseDto, {
      episode: entity.episode,
      numbers: entity.getNumberArray(),
    });
  }
}
