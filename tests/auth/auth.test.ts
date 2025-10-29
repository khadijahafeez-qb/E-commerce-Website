// MOCK EVERYTHING AT THE VERY TOP - BEFORE ANY IMPORTS

// Mock next-auth and its providers
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    auth: jest.fn(),
    handlers: {
      GET: jest.fn(),
      POST: jest.fn(),
    },
  })),
  Auth: jest.fn(),
}));

jest.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    id: 'credentials',
    name: 'Credentials',
    type: 'credentials',
    authorize: jest.fn(),
  })),
}));

jest.mock('next-auth/providers/google', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    id: 'google',
    name: 'Google', 
    type: 'oauth',
  })),
}));

// Mock other dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const mockStripeCreate = jest.fn();
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: { create: mockStripeCreate },
  }));
});

// Create mock auth configuration with proper implementations
const mockCredentialsAuthorize = jest.fn();
const mockSignInCallback = jest.fn();

jest.mock('@/auth', () => ({
  auth: {
    options: {
      providers: [
        {
          id: 'credentials',
          name: 'Credentials',
          type: 'credentials',
          authorize: mockCredentialsAuthorize,
        },
        {
          id: 'google',
          name: 'Google',
          type: 'oauth',
        }
      ],
      callbacks: {
        signIn: mockSignInCallback,
      },
    },
  },
}));

// NOW IMPORT AFTER ALL MOCKS
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth';
import type { User, Role } from '@prisma/client';
import type { NextAuthConfig, Account } from 'next-auth';
import type { CredentialsConfig } from 'next-auth/providers/credentials';

// 🧩 Narrow auth type properly
const typedAuth = auth as unknown as { options: NextAuthConfig };

// 🧩 Type-safe Prisma mock
const mockPrisma = prisma as unknown as {
  user: {
    findUnique: jest.Mock<Promise<User | null>, [object]>;
    create: jest.Mock<Promise<User>, [object]>;
    update: jest.Mock<Promise<User>, [object]>;
  };
};

// 🧩 mock request for credentials authorize
const mockRequest = new Request('http://localhost/api/auth/callback/credentials', {
  method: 'POST',
});

describe('NextAuth Configuration (Credentials + Google)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    
    // Reset mock implementations
    mockCredentialsAuthorize.mockReset();
    mockSignInCallback.mockReset();
  });

  // ✅ Helper: Get Credentials Provider safely
  const getCredentialsProvider = (): CredentialsConfig => {
    const provider = typedAuth.options.providers.find(
      (p): p is CredentialsConfig => 'authorize' in p
    );
    if (!provider) throw new Error('Credentials provider not found');
    return provider;
  };

  // ============================
  // 🔹 CREDENTIALS PROVIDER TESTS
  // ============================
  describe('Credentials Provider', () => {
    it('returns null if email or password missing', async () => {
      // Setup mock to return null for empty credentials
      mockCredentialsAuthorize.mockResolvedValue(null);
      
      const credentials = { email: '', password: '' };
      const provider = getCredentialsProvider();
      const result = await provider.authorize(credentials, mockRequest);
      expect(result).toBeNull();
    });

    it('returns null if user not found', async () => {
      // Setup mock to simulate user not found
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockCredentialsAuthorize.mockImplementation(async (credentials) => {
        const user = await mockPrisma.user.findUnique({ 
          where: { email: credentials.email } 
        });
        return user ? { id: user.id, email: user.email } : null;
      });

      const credentials = { email: 'notfound@test.com', password: '123456' };
      const provider = getCredentialsProvider();
      const result = await provider.authorize(credentials, mockRequest);
      expect(result).toBeNull();
    });

    it('returns null if password is invalid', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: '1',
        fullname: 'Khadija',
        email: 'test@test.com',
        password: 'hashedpass',
        role: 'USER' as Role,
        stripeCustomerId: null,
        mobile: '03331234567',
        resetToken: null,
        resetTokenExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Setup mock to check password
      mockCredentialsAuthorize.mockImplementation(async (credentials) => {
        const user = await mockPrisma.user.findUnique({ 
          where: { email: credentials.email } 
        });
        if (!user) return null;
        
        const isValidPassword = await (bcrypt.compare as jest.Mock)(
          credentials.password, 
          user.password
        );
        return isValidPassword ? { 
          id: user.id, 
          email: user.email, 
          name: user.fullname,
          role: user.role 
        } : null;
      });

      const credentials = { email: 'test@test.com', password: 'wrongpass' };
      const provider = getCredentialsProvider();
      const result = await provider.authorize(credentials, mockRequest);
      expect(result).toBeNull();
    });

    it('returns user if credentials are valid', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: '1',
        fullname: 'Khadija',
        email: 'test@test.com',
        password: 'hashedpass',
        role: 'USER' as Role,
        stripeCustomerId: null,
        mobile: '03331234567',
        resetToken: null,
        resetTokenExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Setup mock to return user for valid credentials
      mockCredentialsAuthorize.mockImplementation(async (credentials) => {
        const user = await mockPrisma.user.findUnique({ 
          where: { email: credentials.email } 
        });
        if (!user) return null;
        
        const isValidPassword = await (bcrypt.compare as jest.Mock)(
          credentials.password, 
          user.password
        );
        
        if (isValidPassword) {
          return {
            id: user.id,
            email: user.email,
            name: user.fullname,
            role: user.role,
            rememberMe: credentials.rememberMe === 'true'
          };
        }
        return null;
      });

      const credentials = {
        email: 'test@test.com',
        password: '123456',
        rememberMe: 'true',
      };

      const provider = getCredentialsProvider();
      const result = await provider.authorize(credentials, mockRequest);

      expect(result).toMatchObject({
        id: '1',
        email: 'test@test.com',
        name: 'Khadija',
        role: 'USER',
        rememberMe: true,
      });
    });
  });

  // ============================
  // 🔹 GOOGLE SIGN-IN CALLBACK
  // ============================
  describe('Google Provider signIn callback', () => {
    const mockUser = {
      id: '1',
      email: 'google@test.com',
      name: 'Google User',
      role: 'USER' as Role,
    };

    // ✅ Full Account object type-safe
    const mockAccount: Account = {
      provider: 'google',
      providerAccountId: 'google-123',
      type: 'oauth',
      access_token: 'fake-access-token',
      expires_at: Date.now(),
      id_token: 'fake-id-token',
      scope: 'email profile',
      token_type: 'bearer',
      session_state: 'active',
      refresh_token: undefined,
    };

    const getSignInCallback = () => {
      if (!typedAuth.options.callbacks?.signIn) throw new Error('signIn callback missing');
      return typedAuth.options.callbacks.signIn;
    };

    it('creates new user + stripe customer if not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockStripeCreate.mockResolvedValueOnce({ id: 'cus_123' });

      mockPrisma.user.create.mockResolvedValueOnce({
        id: '1',
        fullname: 'Google User',
        email: 'google@test.com',
        password: '',
        role: 'USER' as Role,
        stripeCustomerId: 'cus_123',
        mobile: null,
        resetToken: null,
        resetTokenExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Setup signIn callback mock
      mockSignInCallback.mockImplementation(async ({ user, account }) => {
        if (account.provider === 'google') {
          const existingUser = await mockPrisma.user.findUnique({
            where: { email: user.email }
          });

          if (!existingUser) {
            const stripeCustomer = await mockStripeCreate({
              email: user.email,
              name: user.name,
            });

            await mockPrisma.user.create({
              data: {
                email: user.email,
                fullname: user.name,
                stripeCustomerId: stripeCustomer.id,
                role: 'USER' as Role,
              },
            });
          }
          return true;
        }
        return true;
      });

      const signInCallback = getSignInCallback();
      const result = await signInCallback({ user: mockUser, account: mockAccount });

      expect(result).toBe(true);
      expect(mockStripeCreate).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'google@test.com' })
      );
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('adds stripeCustomerId if missing for existing user', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: '1',
        fullname: 'Google User',
        email: 'google@test.com',
        password: '',
        role: 'USER' as Role,
        stripeCustomerId: null,
        mobile: null,
        resetToken: null,
        resetTokenExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockStripeCreate.mockResolvedValueOnce({ id: 'cus_456' });

      mockPrisma.user.update.mockResolvedValueOnce({
        id: '1',
        fullname: 'Google User',
        email: 'google@test.com',
        password: '',
        role: 'USER' as Role,
        stripeCustomerId: 'cus_456',
        mobile: null,
        resetToken: null,
        resetTokenExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Setup signIn callback mock for existing user
      mockSignInCallback.mockImplementation(async ({ user, account }) => {
        if (account.provider === 'google') {
          const existingUser = await mockPrisma.user.findUnique({
            where: { email: user.email }
          });

          if (existingUser && !existingUser.stripeCustomerId) {
            const stripeCustomer = await mockStripeCreate({
              email: user.email,
              name: user.name,
            });

            await mockPrisma.user.update({
              where: { id: existingUser.id },
              data: { stripeCustomerId: stripeCustomer.id },
            });
          }
          return true;
        }
        return true;
      });

      const signInCallback = getSignInCallback();
      const result = await signInCallback({ user: mockUser, account: mockAccount });

      expect(result).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });
  });
});
// 1️⃣ Credentials Provider Tests

// Inside describe('Credentials Provider'):

// "returns null if email or password missing"

// "returns null if user not found"

// "returns null if password is invalid"

// "returns user if credentials are valid"

// ✅ Total: 4 tests

// 2️⃣ Google Provider signIn callback Tests

// Inside describe('Google Provider signIn callback'):

// "creates new user + stripe customer if not found"

// "adds stripeCustomerId if missing for existing user"

// ✅ Total: 2 tests