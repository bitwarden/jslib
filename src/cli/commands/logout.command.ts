import * as program from 'commander';

import { AuthService } from '../../abstractions/auth.service';
import { I18nService } from '../../abstractions/i18n.service';

import { Response } from '../models/response';
import { MessageResponse } from '../models/response/messageResponse';

export class LogoutCommand {
    constructor(private authService: AuthService, private i18nService: I18nService,
        private logoutCallback: () => Promise<void>) { }

    async run(cmd: program.Command) {
        await this.logoutCallback();
        this.authService.logOut(() => { /* Do nothing */ });
        const res = new MessageResponse('You have logged out.', null);
        return Response.success(res);
    }
}
