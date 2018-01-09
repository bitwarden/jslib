export interface UserService {
    userId: string;
    email: string;
    stamp: string;
    setUserIdAndEmail(userId: string, email: string): Promise<any>;
    setSecurityStamp(stamp: string): Promise<any>;
    getUserId(): Promise<string>;
    getEmail(): Promise<string>;
    getSecurityStamp(): Promise<string>;
    clear(): Promise<any>;
    isAuthenticated(): Promise<boolean>;
}
