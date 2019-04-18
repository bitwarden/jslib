import { Injectable } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanActivate,
    Router,
    RouterStateSnapshot,
} from '@angular/router';

import { LockService } from '../../abstractions/lock.service';
import { MessagingService } from '../../abstractions/messaging.service';
import { UserService } from '../../abstractions/user.service';

@Injectable()
export class AuthGuardService implements CanActivate {
    constructor(private lockService: LockService, private userService: UserService, private router: Router,
        private messagingService: MessagingService) { }

    async canActivate(route: ActivatedRouteSnapshot, routerState: RouterStateSnapshot) {
        const isAuthed = await this.userService.isAuthenticated();
        if (!isAuthed) {
            this.messagingService.send('authBlocked');
            return false;
        }

        const locked = await this.lockService.isLocked();
        if (locked) {
            if (routerState != null) {
                this.messagingService.send('lockedUrl', { url: routerState.url });
            }
            this.router.navigate(['lock']);
            return false;
        }

        return true;
    }
}
