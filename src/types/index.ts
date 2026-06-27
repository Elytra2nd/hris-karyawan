import { Prisma } from '@prisma/client';

export type Employee = Prisma.EmployeeGetPayload<{
  include: { contracts: true };
}>;

export type EmployeeWithoutContracts = Prisma.EmployeeGetPayload<{}>;

export type Contract = Prisma.ContractGetPayload<{
  include: { employee: true };
}>;

export type ContractWithoutEmployee = Prisma.ContractGetPayload<{}>;

// For contract lists without the employee relation (when employee is passed separately)
export type ContractListItem = Prisma.ContractGetPayload<{}>;

export type Position = Prisma.PositionGetPayload<{}>;

export type User = Prisma.UserGetPayload<{}>;

export type AuditLog = Prisma.AuditLogGetPayload<{}>;

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
