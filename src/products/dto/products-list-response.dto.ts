import { Expose, Transform } from 'class-transformer';

export class ProductsListResponseDto {
  name: string;
  priceInPLNgr: string;
  isInStock: boolean;
  upvote: number;

  @Transform(({ value: description }) => {
    if (description.length > 100) {
      return `${description.substring(0, 100)}...`;
    }
    return description;
  })
  description: string;

  @Expose()
  @Transform(({ obj }) => {
    return obj.description.length;
  })
  descriptionLength: string;
}
