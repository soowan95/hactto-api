import { DomainVisitor } from '../aggregates/visitor.entity';

export const VISITOR_REPOSITORY_TOKEN = 'IVisitorRepository';

export interface IVisitorRepository {
  insert(id: string, ip: string): Promise<void>;
  findById(id: string): Promise<DomainVisitor | null>;
  updateIp(id: string, ip: string): Promise<void>;
}
