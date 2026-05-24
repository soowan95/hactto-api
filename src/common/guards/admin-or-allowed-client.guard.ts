import {
  CanActivate,
  ExecutionContext,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { AllowedClientGuard } from './allowed-client.guard';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class AdminOrAllowedClientGuard implements CanActivate, OnModuleInit {
  private adminGuard: AdminGuard;
  private allowedClientGuard: AllowedClientGuard;

  constructor(private moduleRef: ModuleRef) {}

  onModuleInit() {
    this.adminGuard = this.moduleRef.get(AdminGuard, { strict: false });
    this.allowedClientGuard = this.moduleRef.get(AllowedClientGuard, {
      strict: false,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAdmin = await this.adminGuard.canActivate(context);
    if (isAdmin) return true;

    return this.allowedClientGuard.canActivate(context);
  }
}
