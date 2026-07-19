import { IpAddress } from '../vos/ip-address.vo';

export class DomainUser {
  private readonly _ip: IpAddress;

  constructor(
    public readonly id: string,
    ip: string,
  ) {
    this._ip = IpAddress.from(ip);
  }

  get ip() {
    return this._ip.value;
  }
}
