import { ValidateIf } from 'class-validator';

export function CanBeUndefinied(): PropertyDecorator {
  return ValidateIf((_, value) => value !== undefined);
}
