import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { PolicyService } from './policy.service';
import { Admin } from '../../common/decorators/admin.decorator';

@Controller('policy')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Get(':type')
  async getPoliciesList(@Param('type') type: string) {
    return this.policyService.getPoliciesList(type);
  }

  @Get(':type/:id')
  async getPolicyVersion(
    @Param('type') type: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.policyService.getPolicyVersion(type, id);
  }

  @Admin()
  @Post(':type')
  async createPolicyVersion(
    @Param('type') type: string,
    @Body() body: { version?: string; content: string },
  ) {
    return this.policyService.createPolicyVersion(type, body);
  }

  @Admin()
  @Put(':type/:id')
  async updatePolicyVersion(
    @Param('type') type: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { version?: string; content: string },
  ) {
    return this.policyService.updatePolicyVersion(type, id, body);
  }

  @Admin()
  @Delete(':type/:id')
  async deletePolicyVersion(
    @Param('type') type: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.policyService.deletePolicyVersion(type, id);
  }
}
