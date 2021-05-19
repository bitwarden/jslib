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
        const isAuthed = await this.userService.isAuthenticated();
        if (isAuthed) {
            const locked = await this.vaultTimeoutService.isLocked();
            if (locked) {
                return true;
            } else {
                this.router.navigate(['vault']);
            }
            return false;
        }

        this.router.navigate(['']);
    }
}
