import { Module } from '@nestjs/common';
import { ManagerController } from './presentation/manager.controller';
import { ManagerAdminController } from './presentation/manager-admin.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [ManagerController, ManagerAdminController],
  providers: [],
})
export class ManagerModule {}
