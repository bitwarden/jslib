import { Injectable } from '@angular/core';
import {
    CanActivate,
    Router,
} from '@angular/router';

import { LockService } from '../../abstractions/lock.service';
import { MessagingService } from '../../abstractions/messaging.service';
import { UserService } from '../../abstractions/user.service';

@Injectable()
export class AuthGuardService implements CanActivate {
    constructor(private lockService: LockService, private userService: UserService, private router: Router,
        private messagingService: MessagingService) { }

    async canActivate() {
        const isAuthed = await this.userService.isAuthenticated();
        if (!isAuthed) {
            this.messagingService.send('logout');
            return false;
        }

        const locked = await this.lockService.isLocked();
        if (locked) {
            this.router.navigate(['lock']);
            return false;
        }

        return true;
    }
}
