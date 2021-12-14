export class GlobalState {
    enableAlwaysOnTop?: boolean;
    installedVersion?: string;
    lastActive?: number;
    locale?: string;
    openAtLogin?: boolean;
    organizationInvitation?: any;
    rememberedEmail?: string;
    theme?: string;
    window?: Map<string, any> = new Map<string, any>();
    twoFactorToken?: string;
    disableFavicon?: boolean;
    biometricAwaitingAcceptance?: boolean;
    biometricFingerprintValidated?: boolean;
    vaultTimeout?: number;
    vaultTimeoutAction?: string;
    loginRedirect?: any;
    mainWindowSize?: number;
    enableBiometrics?: boolean;
    biometricText?: string;
    noAutoPromptBiometrics?: boolean;
    noAutoPromptBiometricsText?: string;
    stateVersion: number;
}
