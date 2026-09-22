const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

interface OtpEntry {
  code: string;
  expiresAt: number;
}

const store = new Map<string, OtpEntry>();

export const otpStore = {
  set(email: string, code: string): void {
    store.set(email.toLowerCase(), {
      code,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
    });
  },

  verify(email: string, code: string): boolean {
    const entry = store.get(email.toLowerCase());
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      store.delete(email.toLowerCase());
      return false;
    }
    return entry.code === code;
  },

  delete(email: string): void {
    store.delete(email.toLowerCase());
  },

  OTP_EXPIRY_MINUTES: OTP_EXPIRY_MS / 60000,
};
