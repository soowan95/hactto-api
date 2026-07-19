import { Module } from '@nestjs/common';
import { ManagerController } from './presentation/manager.controller';
import { CommonModule } from '../../common/common.module';
import { UserModule } from '../user/user.module';

import { GatewayModule } from '../../gateway.module';

@Module({
  imports: [CommonModule, UserModule, GatewayModule],
  controllers: [ManagerController],
  providers: [],
})
export class ManagerModule {}
