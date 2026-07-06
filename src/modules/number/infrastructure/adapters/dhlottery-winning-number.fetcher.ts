import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { plainToInstance } from 'class-transformer';
import {
  ExternalLotteryData,
  ExternalWinningShop,
  IWinningNumberFetcher,
} from '../../domain/ports/winning-number-fetcher.port';
import {
  Lt365,
  Lt365ResponseDto,
} from '../../presentation/dtos/responses/lt365-response.dto';

@Injectable()
export class DhlotteryWinningNumberFetcher implements IWinningNumberFetcher {
  constructor(private readonly httpService: HttpService) {}

  async fetchShopsByEpisode(episode: number): Promise<ExternalWinningShop[]> {
    const url = `https://www.dhlottery.co.kr/wnprchsplcsrch/selectLtWnShp.do?srchWnShpRnk=all&srchLtEpsd=${episode}&srchShpLctn=&_=${Date.now()}`;
    const response = await firstValueFrom(
      this.httpService.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://dhlottery.co.kr/',
          Accept: 'application/json, text/javascript, */*; q=0.01',
        },
      }),
    );
    const data = response.data;
    const list = data?.data?.list || [];
    return list.map((item: any) => ({
      rank: Number(item.wnShpRnk),
      sortOrder: Number(item.rnum),
      shopName: String(item.shpNm || ''),
      shopAddress: String(item.shpAddr || ''),
      purchaseType: String(item.atmtPsvYnTxt || ''),
      region: String(item.region || ''),
      shopLatitude: item.shpLat ? Number(item.shpLat) : null,
      shopLongitude: item.shpLot ? Number(item.shpLot) : null,
    }));
  }

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
