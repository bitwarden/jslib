import { Injectable } from '@angular/core';
import {
    CanActivate,
    Router,
} from '@angular/router';

import { UserService } from '../../abstractions/user.service';
import { VaultTimeoutService } from '../../abstractions/vaultTimeout.service';

@Injectable()
export class LockGuardService implements CanActivate {
    constructor(private vaultTimeoutService: VaultTimeoutService, private userService: UserService,
        private router: Router) { }

    async canActivate() {
        const locked = await this.vaultTimeoutService.isLocked();
        if (!locked) {
            const isAuthed = await this.userService.isAuthenticated();
            if (!isAuthed) {
                this.router.navigate(['login']);
            } else {
                this.router.navigate(['vault']);
            }
            return false;
        }

        return true;
    }
}
