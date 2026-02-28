import { Role } from '../enums/role.enum';

export interface AuthenticatedUser {
  userId: string;
  phone: string;
  role: Role;
}
