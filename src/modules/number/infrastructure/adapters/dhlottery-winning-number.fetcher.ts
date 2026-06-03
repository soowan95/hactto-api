import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { plainToInstance } from 'class-transformer';
import {
  ExternalLotteryData,
  IWinningNumberFetcher,
} from '../../domain/ports/winning-number-fetcher.port';
import {
  Lt365,
  Lt365ResponseDto,
} from '../../presentation/dtos/responses/lt365-response.dto';

@Injectable()
export class DhlotteryWinningNumberFetcher implements IWinningNumberFetcher {
  constructor(private readonly httpService: HttpService) {}

  async fetchByEpisode(episode: number): Promise<ExternalLotteryData[]> {
    const dataList: ExternalLotteryData[] = [];
    const url = `https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do?srchDir=older&srchCursorLtEpsd=${episode}`;
    const dtoInstance = await this.getAndParseLt365(url);
    for (const lt365 of dtoInstance.data.list) {
      dataList.push({
        episode: lt365.ltEpsd,
        numbers: lt365.getWinningNumber(),
      });
    }
    return dataList;
  }

  async fetchRecentOne(): Promise<ExternalLotteryData> {
    const url = `https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do`;
    const dtoInstance = await this.getAndParseLt365(url);
    const lt365: Lt365 = dtoInstance.data.list.pop()!;
    return {
      episode: lt365.ltEpsd,
      numbers: lt365.getWinningNumber(),
    };
  }

  private async getAndParseLt365(url: string): Promise<Lt365ResponseDto> {
    const response = await firstValueFrom(this.httpService.get(url));
    return plainToInstance(Lt365ResponseDto, response.data);
  }
}
