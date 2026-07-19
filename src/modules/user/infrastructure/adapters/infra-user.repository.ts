import { IUserRepository } from '../../domain/ports/user.port';
import { DomainUser } from '../../domain/aggregates/user.entity';
import { prisma } from '../../../../libs/prisma';
import { InfraUserMapper } from '../mappers/infra-user.mapper';

export class InfraUserRepository implements IUserRepository {
  async insert(id: string, ip: string): Promise<void> {
    await prisma.user.create({
      data: { id, ip },
    });
  }

  async findById(id: string): Promise<DomainUser | null> {
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!user) return null;
    return InfraUserMapper.toEntity(user);
  }

  async updateIp(id: string, ip: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { ip },
    });
  }
}
