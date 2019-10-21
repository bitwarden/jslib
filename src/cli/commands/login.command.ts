import * as program from 'commander';
import * as inquirer from 'inquirer';

import { TwoFactorProviderType } from '../../enums/twoFactorProviderType';

import { AuthResult } from '../../models/domain/authResult';
import { TwoFactorEmailRequest } from '../../models/request/twoFactorEmailRequest';

import { ApiService } from '../../abstractions/api.service';
import { AuthService } from '../../abstractions/auth.service';
import { I18nService } from '../../abstractions/i18n.service';

import { Response } from '../models/response';

import { MessageResponse } from '../models/response/messageResponse';

export class LoginCommand {
    protected validatedParams: () => Promise<any>;
    protected success: () => Promise<MessageResponse>;

    constructor(protected authService: AuthService, protected apiService: ApiService,
        protected i18nService: I18nService) { }

    async run(email: string, password: string, cmd: program.Command) {
        const canInteract = process.stdout.isTTY && process.env.BW_NOINTERACTION !== 'true';
        if ((email == null || email === '') && canInteract) {
            const answer: inquirer.Answers = await inquirer.createPromptModule({ output: process.stderr })({
                type: 'input',
                name: 'email',
                message: 'Email address:',
            });
            email = answer.email;
        }
        if (email == null || email.trim() === '') {
            return Response.badRequest('Email address is required.');
        }
        if (email.indexOf('@') === -1) {
            return Response.badRequest('Email address is invalid.');
        }

        if ((password == null || password === '') && canInteract) {
            const answer: inquirer.Answers = await inquirer.createPromptModule({ output: process.stderr })({
                type: 'password',
                name: 'password',
                message: 'Master password:',
            });
            password = answer.password;
        }
        if (password == null || password === '') {
            return Response.badRequest('Master password is required.');
        }

        let twoFactorToken: string = cmd.code;
        let twoFactorMethod: TwoFactorProviderType = null;
        try {
            if (cmd.method != null) {
                twoFactorMethod = parseInt(cmd.method, null);
            }
        } catch (e) {
            return Response.error('Invalid two-step login method.');
        }

        try {
            if (this.validatedParams != null) {
                await this.validatedParams();
            }

            let response: AuthResult = null;
            if (twoFactorToken != null && twoFactorMethod != null) {
                response = await this.authService.logInComplete(email, password, twoFactorMethod,
                    twoFactorToken, false);
            } else {
                response = await this.authService.logIn(email, password);
                if (response.twoFactor) {
                    let selectedProvider: any = null;
                    const twoFactorProviders = this.authService.getSupportedTwoFactorProviders(null);
                    if (twoFactorProviders.length === 0) {
                        return Response.badRequest('No providers available for this client.');
                    }

                    if (twoFactorMethod != null) {
                        try {
                            selectedProvider = twoFactorProviders.filter((p) => p.type === twoFactorMethod)[0];
                        } catch (e) {
                            return Response.error('Invalid two-step login method.');
                        }
                    }

                    if (selectedProvider == null) {
                        if (twoFactorProviders.length === 1) {
                            selectedProvider = twoFactorProviders[0];
                        } else if (canInteract) {
                            const options = twoFactorProviders.map((p) => p.name);
                            options.push(new inquirer.Separator());
                            options.push('Cancel');
                            const answer: inquirer.Answers =
                                await inquirer.createPromptModule({ output: process.stderr })({
                                    type: 'list',
                                    name: 'method',
                                    message: 'Two-step login method:',
                                    choices: options,
                                });
                            const i = options.indexOf(answer.method);
                            if (i === (options.length - 1)) {
                                return Response.error('Login failed.');
                            }
                            selectedProvider = twoFactorProviders[i];
                        }
                        if (selectedProvider == null) {
                            return Response.error('Login failed. No provider selected.');
                        }
                    }

                    if (twoFactorToken == null && response.twoFactorProviders.size > 1 &&
                        selectedProvider.type === TwoFactorProviderType.Email) {
                        const emailReq = new TwoFactorEmailRequest(this.authService.email,
                            this.authService.masterPasswordHash);
                        await this.apiService.postTwoFactorEmail(emailReq);
                    }

                    if (twoFactorToken == null) {
                        if (canInteract) {
                            const answer: inquirer.Answers =
                                await inquirer.createPromptModule({ output: process.stderr })({
                                    type: 'input',
                                    name: 'token',
                                    message: 'Two-step login code:',
                                });
                            twoFactorToken = answer.token;
                        }
                        if (twoFactorToken == null || twoFactorToken === '') {
                            return Response.badRequest('Code is required.');
                        }
                    }

                    response = await this.authService.logInTwoFactor(selectedProvider.type,
                        twoFactorToken, false);
                }
            }

            if (response.twoFactor) {
                return Response.error('Login failed.');
            }

            if (this.success != null) {
                const res = await this.success();
                return Response.success(res);
            } else {
                const res = new MessageResponse('You are logged in!', null);
                return Response.success(res);
            }
        } catch (e) {
            return Response.error(e);
        }
    }
}
