export abstract class BiometricMain {
    init: () => Promise<void>;
    supportsBiometric: () => Promise<boolean>;
    requestCreate: () => Promise<boolean>;
}
