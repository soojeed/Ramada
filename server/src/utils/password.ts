import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Same policy as the original PasswordPolicy.cs:
 * min 8 chars, at least 1 letter and 1 digit.
 */
export function validatePasswordPolicy(password: string): string | null {
  if (!password || !password.trim()) return "Password waa lagama maarmaan.";
  if (password.length < 8) return "Password waa in uu ka koobnaadaa ugu yaraan 8 xaraf.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password waa in uu ku jiraan xuruuf (a-z) iyo number (0-9) labadaba.";
  }
  return null;
}

export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}
