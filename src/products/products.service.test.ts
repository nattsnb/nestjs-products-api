import {ProductsService} from "./products.service";
import {Test} from "@nestjs/testing";
import {ConfigModule} from "@nestjs/config";
import {PrismaService} from "../database/prisma.service";
import {ProductNotFoundException} from "./product-not-found-exception";
import {WrongCredentialsException} from "../authentication/wrong-credentials-exception";

describe('The ProductsService', () => {
  let productService: ProductsService;
  let findUniqueProductMock: jest.Mock = jest.fn();
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findUnique: findUniqueProductMock
            },
          },
        },
      ],
      imports: [
        ConfigModule.forRoot(),
      ],
    }).compile();

    productService = await module.get<ProductsService>(ProductsService);
  });

  describe('getOne', () => {
    afterEach(() => {
      findUniqueProductMock.mockClear()
    })

    it('should use id argument when calling the prisma.product.findUnique query', async () => {
      const productId = 1;
      findUniqueProductMock.mockResolvedValue({});

      await productService.getOne(productId);

      expect(findUniqueProductMock).toBeCalledWith({
        where: {
          id: productId
        },
        include: {
          user: true,
          categories: true,
        },
      });
    })

    it('should return product if the product exist', async () => {
      const product = { id: 1 };
      findUniqueProductMock.mockResolvedValue(product);
      const returnedProduct = await productService.getOne(1);

      expect(returnedProduct).toEqual(product);
    });
    it('should throw ProductNotFoundException if the product with given id does not exist', async () => {
      const product = null;
      findUniqueProductMock.mockResolvedValue(product);

      await expect(productService.getOne(1)).rejects.toThrow(ProductNotFoundException)
    });
  });

  // describe('when getOne function is called', () => {
  //   it('the id argument is passed to the prisma findUnique function as property of where', () => {
  //   })
  //
  //   describe('and product with given id exists', () => {
  //     it('should return product')
  //   });
  //   describe('and product with given id does not exist', () => {
  //     it('should throw ProductNotFoundException')
  //   });
  // });
  //
  //
  // describe('when getAllProducts function is called', () => {
  //   it('should return array of Products', () => {
  //   })
  // });
  //
  //
  //
  // describe('when create function is called', () => {
  //   describe('and valid product data is provided', () => {
  //     it('should return new product that includes categories')
  //   });
  //   describe('and invalid product data is provided', () => {
  //     it('should throw the ConflictException error')
  //   });
  // });
});