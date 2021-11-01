import { Injectable } from '@angular/core';
import {
    CanActivate,
    Router,
} from '@angular/router';

import { StateService } from 'jslib-common/abstractions/state.service';
import { VaultTimeoutService } from 'jslib-common/abstractions/vaultTimeout.service';

@Injectable()
export class LockGuardService implements CanActivate {
    constructor(private vaultTimeoutService: VaultTimeoutService, private router: Router,
        private stateService: StateService) { }

    async canActivate() {
        if (!await this.stateService.getIsAuthenticated()) {
            this.router.navigate(['login']);
            return false;
        }

        if (!await this.vaultTimeoutService.isLocked()) {
            this.router.navigate(['vault']);
            return false;
        }

        return true;
    }
}
