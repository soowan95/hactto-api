import { BadRequestException } from '@nestjs/common';
import { isIP } from 'class-validator';

export class IpAddress {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
    Object.freeze(this);
  }

  static from(value: string): IpAddress {
    if (!value) throw new BadRequestException('IP address is required');

    const trimmedValue = value.trim();

    if (!isIP(trimmedValue))
      throw new BadRequestException(`Invalid IP address: ${trimmedValue}`);

    return new IpAddress(trimmedValue);
  }

  get value(): string {
    return this._value;
  }
}
