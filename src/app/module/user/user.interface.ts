import type { UserStatus } from "@prisma/client";

export interface IUpdateUserStatus {
  status: UserStatus;
}
