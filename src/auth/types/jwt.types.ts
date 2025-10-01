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
  jti?: string;
  iat?: number;
  exp?: number;
}

export enum TokenBlacklistScope {
  AccessToken = 'access',
  RefreshToken = 'refresh',
}

// Abstraction for JWT strategy to fetch and validate users without DB coupling
export interface JwtUserLookup {
  // Return an AuthenticatedUser or null if not found/invalid
  getAuthenticatedUserById(id: string): Promise<AuthenticatedUser | null>;
}

// Injection token for providing JwtUserLookup implementation from the app layer
export const JWT_USER_LOOKUP = Symbol('JWT_USER_LOOKUP');

// Optional token blacklist check used by JWT strategy
export interface JwtTokenBlacklist {
  isTokenBlacklisted(
    jti: string,
    scope?: TokenBlacklistScope,
  ): Promise<boolean> | boolean;
}

// Injection token for providing a token blacklist implementation from the app layer
export const JWT_TOKEN_BLACKLIST = Symbol('JWT_TOKEN_BLACKLIST');
