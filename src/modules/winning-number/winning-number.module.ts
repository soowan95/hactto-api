import { Module } from '@nestjs/common';
import { WinningNumberService } from './winning-number.service';
import { WinningNumberController } from './winning-number.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 3,
    }),
  ],
  controllers: [WinningNumberController],
  providers: [WinningNumberService],
})
export class WinningNumberModule {}
