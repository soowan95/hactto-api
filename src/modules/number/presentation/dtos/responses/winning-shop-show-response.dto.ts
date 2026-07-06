import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class WinningShopShowResponseDto {
  @Expose()
  id: number;

  @Expose()
  episode: number;

  @Expose()
  rank: number;

  @Expose()
  sortOrder: number;

  @Expose()
  shopName: string;

  @Expose()
  shopAddress: string;

  @Expose()
  purchaseType: string;

  @Expose()
  region: string;

  @Expose()
  shopLatitude: number | null;

  @Expose()
  shopLongitude: number | null;
}
