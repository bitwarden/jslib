export abstract class AuthService {
    logIn: (email: string, masterPassword: string, twoFactorProvider?: number,
        twoFactorToken?: string, remember?: boolean) => any;
    logOut: (callback: Function) => void;
}
