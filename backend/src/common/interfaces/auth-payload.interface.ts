import { ENUM_USER_ROLE } from '../enums';

export type AuthPayload = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: ENUM_USER_ROLE;
};
