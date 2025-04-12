import { Prisma } from '@prisma/client';

export function prismaRecordNotFoundError() {
  const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
    code: 'P2025',
    clientVersion: '4.0.0',
  });
  Object.setPrototypeOf(error, Prisma.PrismaClientKnownRequestError.prototype);
  return error;
}
