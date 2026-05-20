import { Module } from '@nestjs/common';
import { WinningNumberModule } from './winning-number/winning-number.module';

@Module({
  imports: [WinningNumberModule],
})
export class RootModule {}
