import { DomainUser } from '../aggregates/user.entity';

export const USER_REPOSITORY_TOKEN = 'IUserRepository';

export interface IUserRepository {
  insert(id: string, ip: string): Promise<void>;
  findById(id: string): Promise<DomainUser | null>;
  updateIp(id: string, ip: string): Promise<void>;
}
