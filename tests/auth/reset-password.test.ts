import { POST } from '@/app/api/auth/reset-password/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('POST /api/auth/reset-password', () => {
  const mockDate = new Date(Date.now() + 1000 * 60 * 10); // 10 mins in future

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reset password successfully', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      email: 'test@test.com',
      resetToken: 'hashed_token',
      resetTokenExpires: mockDate,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed');
    (prisma.user.update as jest.Mock).mockResolvedValue({});

    const req = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@test.com',
        token: '123456',
        password: 'newpass123',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toBe('Password reset successfully');
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('should return 400 if user not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nope@test.com',
        token: '123',
        password: 'pass',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Invalid or expired token');
  });

  it('should return 400 if resetToken missing', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      email: 'test@test.com',
      resetToken: null,
      resetTokenExpires: new Date(),
    });

    const req = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', token: 'abc', password: '123' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Invalid or expired token');
  });

  it('should return 400 if token is invalid', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      email: 'test@test.com',
      resetToken: 'hashed_token',
      resetTokenExpires: mockDate,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const req = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', token: 'wrong', password: '123' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Invalid or expired token');
  });

  it('should return 400 if token expired', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      email: 'test@test.com',
      resetToken: 'hashed_token',
      resetTokenExpires: new Date(Date.now() - 1000), // past
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const req = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', token: '123', password: 'newpass' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Invalid or expired token');
  });

  it('should return 500 if bcrypt.hash fails', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      email: 'test@test.com',
      resetToken: 'hashed_token',
      resetTokenExpires: mockDate,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('hash failed'));

    const req = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', token: '123', password: 'newpass' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should return 500 if prisma.update fails', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      email: 'test@test.com',
      resetToken: 'hashed_token',
      resetTokenExpires: mockDate,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed123');
    (prisma.user.update as jest.Mock).mockRejectedValue(new Error('DB failed'));

    const req = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', token: '123', password: 'newpass' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
