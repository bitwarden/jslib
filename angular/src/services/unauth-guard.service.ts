import { Injectable } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanActivate,
    Router,
} from '@angular/router';

import { UserService } from 'jslib-common/abstractions/user.service';
import { VaultTimeoutService } from 'jslib-common/abstractions/vaultTimeout.service';

@Injectable()
export class UnauthGuardService implements CanActivate {

    protected homepage = 'vault';
    constructor(private vaultTimeoutService: VaultTimeoutService, private userService: UserService,
        private router: Router) { }

    async canActivate() {
        const isAuthed = await this.userService.isAuthenticated();
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
