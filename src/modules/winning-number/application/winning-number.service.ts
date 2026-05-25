import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { WinningNumber } from '../../../lib/prisma';
import { firstValueFrom } from 'rxjs';
import {
  Lt365,
  Lt365ResponseDto,
} from '../presentation/dtos/responses/lt365-response.dto';
import {
  IWinningNumberRepository,
  WINNING_NUMBER_REPOSITORY_TOKEN,
} from '../domain/ports/winning-number.repository.interface';

@Injectable()
export class WinningNumberService {
  constructor(
    private readonly httpService: HttpService,
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly winningNumberRepository: IWinningNumberRepository,
  ) {}

  async fetch(lastestEpisode: number): Promise<void> {
    const lt365Map = new Map<number, Lt365>();
    // From the 1st episode to the nearest multiple of 10 to the most recent episode.
    for (let i = 11; i < lastestEpisode; i = i + 10) {
      const response = await firstValueFrom(
        this.httpService.get<Lt365ResponseDto>(
          `https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do?srchDir=older&srchCursorLtEpsd=${i}`,
        ),
      );
      const lt365list = response.data.data.list;
      for (const lt365 of lt365list) {
        lt365Map.set(lt365.ltEpsd, lt365);
      }
    }

    // The last 10 episodes, excluding the most recent one.
    const response = await firstValueFrom(
      this.httpService.get<Lt365ResponseDto>(
        `https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do?srchDir=older&srchCursorLtEpsd=${lastestEpisode}`,
      ),
    );
    const lt365s: Lt365[] = response.data.data.list;
    for (const lt365 of lt365s) {
      lt365Map.set(lt365.ltEpsd, lt365);
    }

    const lt365List: Lt365[] = Array.from(lt365Map.values());

    for (const lt365 of lt365List) {
      await this.winningNumberRepository.upsert(lt365);
    }

    await this.fetchRecentOne();
  }

  async fetchRecentOne(): Promise<void> {
    const response = await firstValueFrom(
      this.httpService.get<Lt365ResponseDto>(
        `https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do`,
      ),
    );

    const lt365: Lt365 = response.data.data.list.pop()!;
    await this.winningNumberRepository.upsert(lt365);
    await this.winningNumberRepository.createPlaceholder(lt365.ltEpsd + 1);
  }

  /**
   * Find all winning numbers from the WINNING_NUMBER table.
   */
  async findAll(options?: any): Promise<WinningNumber[]> {
    return this.winningNumberRepository.findAll(options);
  }

  /**
   * Find one winning number from the WINNING_NUMBER table by episode.
   */
  async findByEpisode(episode: number): Promise<WinningNumber | null> {
    return this.winningNumberRepository.findByEpisode(episode);
  }
}
