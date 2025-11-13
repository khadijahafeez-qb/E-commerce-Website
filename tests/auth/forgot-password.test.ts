import { POST } from '@/app/api/auth/forgot-password/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendMail } from '@/lib/nodemailer';
import { resetPasswordEmail } from '@/lib/templates/resetPasswordEmail';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));
jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));
jest.mock('@/lib/nodemailer', () => ({
  sendMail: jest.fn(),
}));
jest.mock('@/lib/templates/resetPasswordEmail', () => ({
  resetPasswordEmail: jest.fn(),
}));
describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });
  it('should return generic message if user not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    const req = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'nope@test.com' }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.message).toBe('If this email exists, a reset link has been sent.');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
  it('should generate token, save to DB, and send email', async () => {
    const fakeToken = 'abc123';
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ email: 'test@test.com' });
    (crypto.randomBytes as jest.Mock).mockReturnValue(Buffer.from(fakeToken));
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_token');
    (prisma.user.update as jest.Mock).mockResolvedValue({});
    (sendMail as jest.Mock).mockResolvedValue({});
    (resetPasswordEmail as jest.Mock).mockReturnValue('<html>template</html>');
    const req = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com' }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.message).toBe('Password reset link sent to your email');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'test@test.com' },
      })
    );
    expect(sendMail).toHaveBeenCalledWith(
      'test@test.com',
      'Password Reset Request',
      expect.any(String)
    );
  });
  it('should handle sendMail failure', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ email: 'test@test.com' });
    (crypto.randomBytes as jest.Mock).mockReturnValue(Buffer.from('abc123'));
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_token');
    (prisma.user.update as jest.Mock).mockResolvedValue({});
    (sendMail as jest.Mock).mockRejectedValue(new Error('Mail failed'));
    const req = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com' }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
  it('should handle prisma.user.update failure', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ email: 'test@test.com' });
    (crypto.randomBytes as jest.Mock).mockReturnValue(Buffer.from('abc123'));
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_token');
    (prisma.user.update as jest.Mock).mockRejectedValue(new Error('DB crashed'));
    const req = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com' }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
  it('should handle invalid JSON in body', async () => {
    const req = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: 'invalid_json',
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

