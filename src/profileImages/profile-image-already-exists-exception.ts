import { ConflictException } from '@nestjs/common';

export class ProfileImageAlreadyExistsException extends ConflictException {
  constructor() {
    super('User already has a profile image.');
  }
}
