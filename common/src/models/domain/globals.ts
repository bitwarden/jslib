export class Globals {
    decodedToken: any;
    enableAlwaysOnTop: boolean;
    installedVersion: string;
    lastActive: number;
    locale: string;
    openAtLogin: boolean;
    organizationInvitation: any;
    rememberEmail: boolean;
    rememberedEmail: string;
    theme: string;
    window: Map<string, any> = new Map<string, any>();
    twoFactorToken: string;

    biometricAwaitingAcceptance: boolean;
    biometricFingerprintValidated: boolean;
}
