import { IpAddress } from '../vos/ip-address.vo';

export class DomainVisitor {
  private readonly _ip: IpAddress;

  constructor(
    public readonly id: string,
    ip: string,
    public readonly isBlocked: boolean = false,
  ) {
    this._ip = IpAddress.from(ip);
  }

  get ip() {
    return this._ip.value;
  }
}
