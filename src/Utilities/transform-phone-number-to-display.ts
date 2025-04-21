import { Transform } from 'class-transformer';

export function TransformPhoneNumberToDisplay(): PropertyDecorator {
  return Transform(({ value }) => {
    if (!value || typeof value !== 'string') {
      return value;
    }
    const numberLength = value.length;
    const visiblePart = value.substring(numberLength - 3, numberLength);
    return `${'*'.repeat(numberLength - 3)}${visiblePart}`;
  });
}
