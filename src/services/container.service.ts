import { CryptoService } from '../abstractions/crypto.service';
import { PlatformUtilsService } from '../abstractions/platformUtils.service';

export class ContainerService {
    constructor(private cryptoService: CryptoService,
        private platformUtilsService: PlatformUtilsService) {
    }

    // deprecated, use attachToGlobal instead
    attachToWindow(win: any) {
        this.attachToGlobal(win);
    }

    attachToGlobal(global: any) {
        if (!global.bitwardenContainerService) {
            global.bitwardenContainerService = this;
        }
    }

    getCryptoService(): CryptoService {
        return this.cryptoService;
    }

    getPlatformUtilsService(): PlatformUtilsService {
        return this.platformUtilsService;
    }
}
