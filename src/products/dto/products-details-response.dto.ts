import { Transform } from 'class-transformer';

export class ProductsDetailsResponseDto {
  name: string;
  priceInPLNgr: string;
  isInStock: boolean;
  @Transform(({ value: description }) => {
    return description.charAt(0).toUpperCase() + description.slice(1);
  })
  description: string;
  upvote: number;
}
