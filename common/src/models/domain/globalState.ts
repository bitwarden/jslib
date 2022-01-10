import { StateVersion } from "../../enums/stateVersion";
import { EnvironmentUrls } from "./environmentUrls";

export class GlobalState {
  enableAlwaysOnTop?: boolean;
  installedVersion?: string;
  lastActive?: number;
  locale?: string = "en";
  openAtLogin?: boolean;
  organizationInvitation?: any;
  ssoCodeVerifier?: string;
  ssoOrganizationIdentifier?: string;
  ssoState?: string;
  rememberedEmail?: string;
  theme?: string = "light";
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
  stateVersion: StateVersion = StateVersion.Latest;
  environmentUrls: EnvironmentUrls = new EnvironmentUrls();
}
