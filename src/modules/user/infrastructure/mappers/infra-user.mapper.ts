import { User } from '../../../../generated/prisma/client';
import { DomainUser } from '../../domain/aggregates/user.entity';

export class InfraUserMapper {
  static toEntity(raw: User): DomainUser {
    return new DomainUser(raw.id, raw.ip || '0.0.0.0');
  }
}
