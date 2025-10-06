export function resetPasswordEmail(resetUrl: string) {
  return `
  <div style="font-family: Arial, sans-serif; color: #333;">
    <h2>Password Reset Request</h2>
    <p>Hello,</p>
    <p>You requested to reset your password. Click the link below to proceed. 
    This link is valid for 15 minutes.</p>

    <p><a href="${resetUrl}" style="color: #007bff;">Reset your password</a></p>

    <p>If you didn’t request this, please ignore this email.</p>
    <p>— The Support Team</p>
  </div>
  `;
}
