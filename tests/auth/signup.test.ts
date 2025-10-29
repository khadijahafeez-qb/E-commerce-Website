import { POST } from '@/app/api/auth/signup/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import Stripe from 'stripe';

// --- MOCKS ---

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

// Stripe mock factory
const mockCreateCustomer = jest.fn();
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: mockCreateCustomer,
    },
  }));
});

describe('POST /api/auth/signup', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should return 400 if email already exists', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1 });

    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        fullname: 'Khadija',
        email: 'test@test.com',
        mobile: '03331234567',
        password: '123456',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Email already registered');
  });

  it('should return 500 if Stripe key is missing', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed123');
    delete process.env.STRIPE_SECRET_KEY;

    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        fullname: 'Khadija',
        email: 'new@test.com',
        mobile: '03331234567',
        password: '123456',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Stripe not configured');
  });

  it('should create user and return 201 if all is valid', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed123');

    mockCreateCustomer.mockResolvedValue({ id: 'cus_123' });

    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 1,
      fullname: 'Khadija',
      email: 'new@test.com',
      stripeCustomerId: 'cus_123',
    });

    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        fullname: 'Khadija',
        email: 'new@test.com',
        mobile: '03331234567',
        password: '123456',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.user.email).toBe('new@test.com');
    expect(data.user.stripeCustomerId).toBe('cus_123');
  });

  it('should handle unexpected errors gracefully', async () => {
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB crashed'));

    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        fullname: 'Test',
        email: 'test@test.com',
        mobile: '03331234567',
        password: '123456',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
