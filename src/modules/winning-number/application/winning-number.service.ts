import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { WinningNumber } from '../domain/entities/winning-number.entity';
import { firstValueFrom } from 'rxjs';
import {
  Lt365,
  Lt365ResponseDto,
} from '../presentation/dtos/responses/lt365-response.dto';
import {
  IWinningNumberRepository,
  WINNING_NUMBER_REPOSITORY_TOKEN,
} from '../domain/ports/winning-number.repository.interface';
import { plainToInstance } from 'class-transformer';
import { WinningNumberShowResponseDto } from '../presentation/dtos/responses/winning-number-show-response.dto';

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
      const url = `https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do?srchDir=older&srchCursorLtEpsd=${i}`;
      const dtoInstance = await this.getAndParseLt365(url);
      for (const lt365 of dtoInstance.data.list) {
        lt365Map.set(lt365.ltEpsd, lt365);
      }
    }

    // The last 10 episodes, excluding the most recent one.
    const url = `https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do?srchDir=older&srchCursorLtEpsd=${lastestEpisode}`;
    const dtoInstance = await this.getAndParseLt365(url);
    for (const lt365 of dtoInstance.data.list) {
      lt365Map.set(lt365.ltEpsd, lt365);
    }

    const lt365List: Lt365[] = Array.from(lt365Map.values());

    for (const lt365 of lt365List) {
      const winningNumber = new WinningNumber(
        lt365.ltEpsd,
        lt365.getWinningNumber(),
        true,
      );
      await this.winningNumberRepository.upsert(winningNumber);
    }

    await this.fetchRecentOne();
  }

  async fetchRecentOne(): Promise<void> {
    const url = `https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do`;
    const dtoInstance = await this.getAndParseLt365(url);

    const lt365: Lt365 = dtoInstance.data.list.pop()!;
    const winningNumber = await this.winningNumberRepository.findByEpisode(
      lt365.ltEpsd,
    );
    winningNumber.draw(lt365.getWinningNumber());
    await this.winningNumberRepository.upsert(winningNumber);
    await this.winningNumberRepository.createPlaceholder(
      WinningNumber.placeholder(lt365.ltEpsd + 1),
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

  private async getAndParseLt365(url: string): Promise<Lt365ResponseDto> {
    const response = await firstValueFrom(this.httpService.get(url));
    return plainToInstance(Lt365ResponseDto, response.data);
  }
}
