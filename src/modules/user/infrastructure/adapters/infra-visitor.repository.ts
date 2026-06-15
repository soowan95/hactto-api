import { IVisitorRepository } from '../../domain/ports/visitor.port';
import { DomainVisitor } from '../../domain/aggregates/visitor.entity';
import { prisma } from '../../../../libs/prisma';
import { InfraVisitorMapper } from '../mappers/infra-visitor.mapper';

export class InfraVisitorRepository implements IVisitorRepository {
  async insert(id: string, ip: string): Promise<void> {
    await prisma.visitor.create({
      data: { id, ip },
    });
  }

  async findById(id: string): Promise<DomainVisitor | null> {
    const visitor = await prisma.visitor.findUnique({
      where: {
        id: id,
      },
    });

    if (!visitor) return null;
    return InfraVisitorMapper.toEntity(visitor);
  }

  async updateIp(id: string, ip: string): Promise<void> {
    await prisma.visitor.update({
      where: { id },
      data: { ip },
    });
  }

  async updateBlockStatus(id: string, isBlocked: boolean): Promise<void> {
    await prisma.visitor.update({
      where: { id },
      data: { isBlocked },
    });
  }
}

