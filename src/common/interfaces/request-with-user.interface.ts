import type { Request } from 'express';
import type { AuthenticatedUser } from './authenticated-user.interface';

export type RequestWithUser = Request & {
  user?: AuthenticatedUser;
  requestId?: string;
};
