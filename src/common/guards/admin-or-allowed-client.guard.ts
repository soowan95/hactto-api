import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { AllowedClientGuard } from './allowed-client.guard';

@Injectable()
export class AdminOrAllowedClientGuard implements CanActivate {
  constructor(
    private readonly adminGuard: AdminGuard,
    private readonly allowedClientGuard: AllowedClientGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAdmin = await this.adminGuard.canActivate(context);
    if (isAdmin) return true;

    return this.allowedClientGuard.canActivate(context);
  }
}
