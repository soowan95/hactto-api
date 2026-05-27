import { Inject, Injectable } from '@nestjs/common';
import { DomainWinningNumber } from '../domain/entities/winning-number.entity';
import {
  IWinningNumberRepository,
  WINNING_NUMBER_REPOSITORY_TOKEN,
} from '../domain/ports/winning-number.repository.interface';
import {
  ExternalLotteryData,
  IWinningNumberFetcher,
  WINNING_NUMBER_FETCHER_TOKEN,
} from '../domain/ports/winning-number-fetcher.interface';
import { WinningNumberDrawer } from '../domain/services/winning-number-drawer';

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
      const winningNumber = new DomainWinningNumber(
        data.episode,
        data.numbers,
        true,
      );
      await this.winningNumberRepository.upsert(winningNumber);
    }

    await this.fetchRecentOne();
  }

  async fetchRecentOne(): Promise<void> {
    const data = await this.winningNumberFetcher.fetchRecentOne();
    const winningNumber = await this.winningNumberRepository.findByEpisode(
      data.episode,
    );
    if (!winningNumber.isDrawn) {
      winningNumber.draw(data.numbers);
      await this.winningNumberRepository.upsert(winningNumber);
      await this.winningNumberRepository.upsert(
        WinningNumberDrawer.drawPlaceholder(data.episode + 1),
      );
    }
  }

  /**
   * Find all winning numbers from the WINNING_NUMBER table.
   */
  async findAll(options?: any): Promise<DomainWinningNumber[]> {
    return this.winningNumberRepository.findAll(options);
  }

  /**
   * Find one winning number from the WINNING_NUMBER table by episode.
   */
  async findByEpisode(episode: number): Promise<DomainWinningNumber> {
    return this.winningNumberRepository.findByEpisode(episode);
  }

  /**
   * Find the latest winning number.
   */
  async findLatest(): Promise<DomainWinningNumber | null> {
    const entity =
      await this.winningNumberRepository.findLatestWithWinningNumber();
    if (!entity) return null;
    else return entity;
  }
}
