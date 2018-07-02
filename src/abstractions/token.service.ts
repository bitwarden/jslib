export abstract class TokenService {
    token: string;
    decodedToken: any;
    refreshToken: string;
    setTokens: (accessToken: string, refreshToken: string) => Promise<any>;
    setToken: (token: string) => Promise<any>;
    getToken: () => Promise<string>;
    setRefreshToken: (refreshToken: string) => Promise<any>;
    getRefreshToken: () => Promise<string>;
    setTwoFactorToken: (token: string, email: string) => Promise<any>;
    getTwoFactorToken: (email: string) => Promise<string>;
    clearTwoFactorToken: (email: string) => Promise<any>;
    clearToken: () => Promise<any>;
    decodeToken: () => any;
    getTokenExpirationDate: () => Date;
    tokenSecondsRemaining: (offsetSeconds?: number) => number;
    tokenNeedsRefresh: (minutes?: number) => boolean;
    getUserId: () => string;
    getEmail: () => string;
    getEmailVerified: () => boolean;
    getName: () => string;
    getPremium: () => boolean;
    getIssuer: () => string;
}
