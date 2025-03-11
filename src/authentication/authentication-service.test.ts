import { AuthenticationService } from './authentication.service';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {JwtModule, JwtService} from '@nestjs/jwt';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../users/users.module';
import { Test } from '@nestjs/testing';
import { UsersService } from '../users/users.service';
import { User } from '@prisma/client';
import { hash } from 'bcrypt';
import { WrongCredentialsException } from './wrong-credentials-exception';
import {ConflictException, NotFoundException} from '@nestjs/common';
import {SignUpDto} from "./dto/sign-up.dto";

describe('The AuthenticationService', () => {
  let userData: User;
  let password: string;
  let authenticationService: AuthenticationService;
  let jwtServiceMock: JwtService;
  let configServiceMock: ConfigService;
  let userServiceMock: Partial<UsersService>;
  beforeEach(async () => {
    password = 'strongPassword123';
    const hashedPassword = await hash(password, 10);
    userServiceMock = {
      getByEmail: jest.fn(),
      create: jest.fn(),
    };
    jwtServiceMock = new JwtService({ secret: 'secret key' });
    configServiceMock = new ConfigService();
    userData = {
      id: 1,
      email: 'john.smith@gmail.com',
      name: 'John',
      password: hashedPassword,
      addressId: null,
      phoneNumber: null,
      profileImageId: null,
    };
    const module = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: UsersService,
          useValue: userServiceMock,
        },
      ],
      imports: [
        DatabaseModule,
        UsersModule,
        ConfigModule.forRoot(),
        JwtModule.register({
          secret: 'Secret key',
        }),
      ],
    }).compile();

    authenticationService = await module.get(AuthenticationService);
  });
  describe('when the getCookieForLogOut method is called', () => {
    it('should return a correct string', () => {
      const result = authenticationService.getCookieForLogOut();
      expect(result).toBe('Authentication=; HttpOnly; Path=/; Max-Age=0');
    });
  });
  describe('when the get getCookieWithJwtToken method is called', () => {
    describe('and a valid userId is provided', () => {
      let userId: number;
      let token: string;
      beforeEach(() => {
        userId = 1;
        token = 'mockedJwtToken';
        jwtServiceMock.sign = jest.fn().mockReturnValue(token);
        configServiceMock.get = jest.fn().mockReturnValue(43200);
      });
      it('should return a valid authentication cookie', () => {
        const cookie = authenticationService.getCookieWithJwtToken(userId);
        expect(cookie).toBe(`Authentication=${token}; HttpOnly; Path=/; Max-Age=43200`);
      })
    });
    describe('and JWT_EXPIRATION_TIME is missing', () => {
      beforeEach(() => {
        jwtServiceMock.sign = jest.fn().mockReturnValue('mockedJwtToken');
        configServiceMock.get = jest.fn().mockReturnValue(undefined);
      });
      it('should return a cookie with no Max-Age', () => {
        const cookie = authenticationService.getCookieWithJwtToken(1);
        expect(cookie).toBe(`Authentication=mockedJwtToken; HttpOnly; Path=/; Max-Age=`);
      });
    });
    describe('and jwtService.sign() fails', () => {
      beforeEach(() => {
        jwtServiceMock.sign = jest.fn().mockImplementation(() => {
          throw new Error('JWT signing failed');
        });
      });
      it('should throw an error', () => {
        expect(() => authenticationService.getCookieWithJwtToken(1)).toThrow('JWT signing failed');
      });
    });
    describe('and configService.get() returns incorrect values', () => {
      it('should handle null expiration time gracefully', () => {
        configServiceMock.get = jest.fn().mockReturnValue(null);
        const token = 'mockedJwtToken';
        jwtServiceMock.sign = jest.fn().mockReturnValue(token);
        const cookie = authenticationService.getCookieWithJwtToken(1);
        expect(cookie).toBe(`Authentication=${token}; HttpOnly; Path=/; Max-Age=`);
      });
      it('should handle NaN expiration time gracefully', () => {
        configServiceMock.get = jest.fn().mockReturnValue(NaN);
        const token = 'mockedJwtToken';
        jwtServiceMock.sign = jest.fn().mockReturnValue(token);
        const cookie = authenticationService.getCookieWithJwtToken(1);
        expect(cookie).toBe(`Authentication=${token}; HttpOnly; Path=/; Max-Age=NaN`);
      });
      it('should handle empty string expiration time gracefully', () => {
        configServiceMock.get = jest.fn().mockReturnValue('');
        const token = 'mockedJwtToken';
        jwtServiceMock.sign = jest.fn().mockReturnValue(token);
        const cookie = authenticationService.getCookieWithJwtToken(1);
        expect(cookie).toBe(`Authentication=${token}; HttpOnly; Path=/; Max-Age=`);
      });
    });
  });
  describe('when the getAuthenticatedUser method is called', () => {
    describe('and a valid email and password are provided', () => {
      beforeEach(() => {
        (userServiceMock.getByEmail as jest.Mock).mockResolvedValue(userData);
      });
      it('should return the new user', async () => {
        const result = await authenticationService.getAuthenticatedUser({
          email: userData.email,
          password,
        });
        expect(result).toBe(userData);
      });
    });
    describe('an invalid email is provided', () => {
      beforeEach(() => {
        (userServiceMock.getByEmail as jest.Mock).mockRejectedValue(new NotFoundException());
      });
      it('should throw the BadRequestException', async () => {
        return expect(async () => {
          await authenticationService.getAuthenticatedUser({
            email: 'john.smith@gmail.com',
            password,
          });
        }).rejects.toThrow(WrongCredentialsException);
      });
    });
  });
  describe('when the signUp function is called', () => {
    let signUpData: SignUpDto;
    beforeEach(() => {
      signUpData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'StrongPass123!',
        phoneNumber: '+48123456789',
        address: {
          id: 1,
          street: 'Test Street',
          city: 'Test City',
          country: 'PL'
        },
        profileImage: {
          id: 1,
          url: 'http://test.com/image.jpg'
        },
      };
    });
    describe('when a valid user signs up', () => {
      it('should hash the password and create a user', async () => {
        const hashedPassword = await hash(signUpData.password, 10);
        (userServiceMock.create as jest.Mock).mockResolvedValue({
          ...signUpData,
          password: hashedPassword,
        });
        const result = await authenticationService.signUp(signUpData);
        expect(userServiceMock.create).toHaveBeenCalledWith({
          ...signUpData,
          password: expect.any(String),
        });
      });
    });
    describe('when a user tries to sign up with an existing email', () => {
      it('should throw ConflictException', async () => {
        (userServiceMock.create as jest.Mock).mockRejectedValue(new ConflictException());
        await expect(authenticationService.signUp(signUpData)).rejects.toThrow(ConflictException);
      });
    });
    describe('when a user signs up without optional fields', () => {
      beforeEach(() => {
        signUpData = {
          email: 'test@example.com',
          name: 'Test User',
          password: 'StrongPass123!',
        } as SignUpDto;
      });
      it('should create a user with only required fields', async () => {
        const mockUser = {
          id: 1,
          email: signUpData.email,
          name: signUpData.name,
          password: 'hashedPassword',
          addressId: null,
          address: null,
          profileImageId: null,
          profileImage: null,
          phoneNumber: null,
        };
        (userServiceMock.create as jest.Mock).mockResolvedValue(mockUser);
        const result = await authenticationService.signUp(signUpData);
        expect(result).toBeDefined();
        expect(result).toEqual(expect.objectContaining({
          id: 1,
          email: signUpData.email,
          name: signUpData.name
        }));
      });
    });
    describe('when userService.create() throws an error', () => {
      it('should not return the hashed password if user creation fails', async () => {
        (userServiceMock.create as jest.Mock).mockRejectedValue(new Error('DB error'));
        await expect(authenticationService.signUp(signUpData)).rejects.toThrow('DB error');
      });
    });
  });
});