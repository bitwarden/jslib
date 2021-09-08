import { Injectable } from '@angular/core';
import {
    CanActivate,
    Router,
} from '@angular/router';

import { AccountService } from 'jslib-common/abstractions/account.service';
import { VaultTimeoutService } from 'jslib-common/abstractions/vaultTimeout.service';

@Injectable()
export class UnauthGuardService implements CanActivate {

    protected homepage = 'vault';
    constructor(private vaultTimeoutService: VaultTimeoutService, private router: Router,
        private accountService: AccountService) { }

    async canActivate() {
        const isAuthed = this.accountService.activeAccount?.isAuthenticated;
        if (isAuthed) {
            const locked = await this.vaultTimeoutService.isLocked();
            if (locked) {
                this.router.navigate(['lock']);
            } else {
                this.router.navigate([this.homepage]);
            }
            return false;
        }

        return true;
    }
}
