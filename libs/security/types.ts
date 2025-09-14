export interface AuthenticatedUser {
  id: string;
  username?: string | null;
  email: string;
  phone?: string | null;
  countryCode?: string | null;
  profile?: Record<string, unknown> | null;
}

export interface JwtPayload {
  sub: string;
  username?: string;
  email?: string;
  iat?: number;
  exp?: number;
}
