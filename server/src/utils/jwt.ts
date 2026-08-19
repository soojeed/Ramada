import jwt from "jsonwebtoken";

export interface AccessTokenPayload {
  userId: number;
  username: string;
  fullName: string;
  role: string;
  allowedModules: string[];
}

export interface RefreshTokenPayload {
  userId: number;
  tokenVersion?: number;
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "7d";

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error(
    "JWT_ACCESS_SECRET / JWT_REFRESH_SECRET waa lagama maarmaan .env-ka gudihiisa."
  );
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES as jwt.SignOptions["expiresIn"] });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES as jwt.SignOptions["expiresIn"] });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
}
