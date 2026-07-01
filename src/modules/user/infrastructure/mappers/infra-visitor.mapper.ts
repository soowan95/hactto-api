import { Visitor } from '../../../../generated/prisma/client';
import { DomainVisitor } from '../../domain/aggregates/visitor.entity';

export class InfraVisitorMapper {
  static toEntity(raw: Visitor): DomainVisitor {
    return new DomainVisitor(raw.id, raw.ip);
  }
}
