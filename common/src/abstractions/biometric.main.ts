export abstract class BiometricMain {
    isError: boolean;
    init: () => Promise<void>;
    supportsBiometric: () => Promise<boolean>;
    requestCreate: () => Promise<boolean>;
}
