import { Global, Module } from '@nestjs/common';
import { AppGateway } from './app.gateway';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';

@Global()
@Module({
  imports: [CommonModule, AuthModule],
  providers: [AppGateway],
  exports: [AppGateway],
})
export class GatewayModule {}
