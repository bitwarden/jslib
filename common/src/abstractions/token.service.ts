export abstract class TokenService {
  setTokens: (
    accessToken: string,
    refreshToken: string,
    clientIdClientSecret: [string, string]
  ) => Promise<any>;
  setToken: (token: string) => Promise<any>;
  getToken: () => Promise<string>;
  setRefreshToken: (refreshToken: string) => Promise<any>;
  getRefreshToken: () => Promise<string>;
  setClientId: (clientId: string) => Promise<any>;
  getClientId: () => Promise<string>;
  setClientSecret: (clientSecret: string) => Promise<any>;
  getClientSecret: () => Promise<string>;
  toggleTokens: () => Promise<any>;
  setTwoFactorToken: (token: string, email: string) => Promise<any>;
  getTwoFactorToken: (email: string) => Promise<string>;
  clearTwoFactorToken: (email: string) => Promise<any>;
  clearToken: (userId?: string) => Promise<any>;
  decodeToken: (token?: string) => any;
  getTokenExpirationDate: () => Promise<Date>;
  tokenSecondsRemaining: (offsetSeconds?: number) => Promise<number>;
  tokenNeedsRefresh: (minutes?: number) => Promise<boolean>;
  getUserId: () => Promise<string>;
  getEmail: () => Promise<string>;
  getEmailVerified: () => Promise<boolean>;
  getName: () => Promise<string>;
  getPremium: () => Promise<boolean>;
  getIssuer: () => Promise<string>;
  getIsExternal: () => Promise<boolean>;
}
