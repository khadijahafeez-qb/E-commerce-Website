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

// 🧩 Stripe mock
const mockStripeCreate = jest.fn();
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: { create: mockStripeCreate },
  }));
});

// 🧩 bcrypt mock
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// 🧩 mock request for credentials authorize
const mockRequest = new Request('http://localhost/api/auth/callback/credentials', {
  method: 'POST',
});

describe('NextAuth Configuration (Credentials + Google)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
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
      const credentials = { email: '', password: '' };
      const provider = getCredentialsProvider();
      const result = await provider.authorize(credentials, mockRequest);
      expect(result).toBeNull();
    });

    it('returns null if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
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

      const signInCallback = getSignInCallback();
      const result = await signInCallback({ user: mockUser, account: mockAccount });

      expect(result).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });
  });
});
