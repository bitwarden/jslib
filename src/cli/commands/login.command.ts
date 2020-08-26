import * as program from 'commander';
import * as http from 'http';
import * as inquirer from 'inquirer';

import { TwoFactorProviderType } from '../../enums/twoFactorProviderType';

import { AuthResult } from '../../models/domain/authResult';
import { TwoFactorEmailRequest } from '../../models/request/twoFactorEmailRequest';

import { ApiService } from '../../abstractions/api.service';
import { AuthService } from '../../abstractions/auth.service';
import { CryptoFunctionService } from '../../abstractions/cryptoFunction.service';
import { EnvironmentService } from '../../abstractions/environment.service';
import { I18nService } from '../../abstractions/i18n.service';
import { PasswordGenerationService } from '../../abstractions/passwordGeneration.service';

import { Response } from '../models/response';

import { MessageResponse } from '../models/response/messageResponse';

import { NodeUtils } from '../../misc/nodeUtils';
import { Utils } from '../../misc/utils';

// tslint:disable-next-line
const open = require('open');

export class LoginCommand {
    protected validatedParams: () => Promise<any>;
    protected success: () => Promise<MessageResponse>;
    protected canInteract: boolean;
    protected clientId: string;

    private ssoRedirectUri: string = null;

    constructor(protected authService: AuthService, protected apiService: ApiService,
        protected i18nService: I18nService, protected environmentService: EnvironmentService,
        protected passwordGenerationService: PasswordGenerationService,
        protected cryptoFunctionService: CryptoFunctionService, clientId: string) {
        this.clientId = clientId;
    }

    async run(email: string, password: string, cmd: program.Command) {
        this.canInteract = process.env.BW_NOINTERACTION !== 'true';

        let ssoCodeVerifier: string = null;
        let ssoCode: string = null;
        if (cmd.sso != null && this.canInteract) {
            const passwordOptions: any = {
                type: 'password',
                length: 64,
                uppercase: true,
                lowercase: true,
                numbers: true,
                special: false,
            };
            const state = await this.passwordGenerationService.generatePassword(passwordOptions);
            ssoCodeVerifier = await this.passwordGenerationService.generatePassword(passwordOptions);
            const codeVerifierHash = await this.cryptoFunctionService.hash(ssoCodeVerifier, 'sha256');
            const codeChallenge = Utils.fromBufferToUrlB64(codeVerifierHash);
            try {
                ssoCode = await this.getSsoCode(codeChallenge, state);
            } catch {
                return Response.badRequest('Something went wrong. Try again.');
            }
        } else {
            if ((email == null || email === '') && this.canInteract) {
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

            if (password == null || password === '') {
                if (cmd.passwordfile) {
                    password = await NodeUtils.readFirstLine(cmd.passwordfile);
                } else if (cmd.passwordenv && process.env[cmd.passwordenv]) {
                    password = process.env[cmd.passwordenv];
                } else if (this.canInteract) {
                    const answer: inquirer.Answers = await inquirer.createPromptModule({ output: process.stderr })({
                        type: 'password',
                        name: 'password',
                        message: 'Master password:',
                    });
                    password = answer.password;
                }
            }

            if (password == null || password === '') {
                return Response.badRequest('Master password is required.');
            }
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
                if (ssoCode != null && ssoCodeVerifier != null) {
                    response = await this.authService.logInSsoComplete(ssoCode, ssoCodeVerifier, this.ssoRedirectUri,
                        twoFactorMethod, twoFactorToken, false);
                } else {
                    response = await this.authService.logInComplete(email, password, twoFactorMethod,
                        twoFactorToken, false);
                }
            } else {
                if (ssoCode != null && ssoCodeVerifier != null) {
                    response = await this.authService.logInSso(ssoCode, ssoCodeVerifier, this.ssoRedirectUri);

                } else {
                    response = await this.authService.logIn(email, password);
                }
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
                        } else if (this.canInteract) {
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
                        if (this.canInteract) {
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

            if (response.resetMasterPassword) {
                return Response.error('In order to login with SSO from the CLI, you must first initiate the same' +
                    ' process through the web vault to set a master password.');
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

    private async getSsoCode(codeChallenge: string, state: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const callbackServer = http.createServer((req, res) => {
                const urlString = 'http://localhost' + req.url;
                const url = new URL(urlString);
                const code = url.searchParams.get('code');
                const receivedState = url.searchParams.get('state');
                res.setHeader('Content-Type', 'text/html');
                if (code != null && receivedState != null && receivedState === state) {
                    res.writeHead(200);
                    res.end('<html><head><title>Success | Bitwarden CLI</title></head><body>' +
                        '<h1>Successfully authenticated with the Bitwarden CLI</h1>' +
                        '<p>You may now close this tab and return to the terminal.</p>' +
                        '</body></html>');
                    callbackServer.close(() => resolve(code));
                } else {
                    res.writeHead(400);
                    res.end('<html><head><title>Failed | Bitwarden CLI</title></head><body>' +
                        '<h1>Something went wrong logging into the Bitwarden CLI</h1>' +
                        '<p>You may now close this tab and return to the terminal.</p>' +
                        '</body></html>');
                    callbackServer.close(() => reject());
                }
            });
            let foundPort = false;
            const webUrl = this.environmentService.webVaultUrl == null ? 'https://vault.bitwarden.com' :
                this.environmentService.webVaultUrl;
            for (let port = 8065; port <= 8070; port++) {
                try {
                    this.ssoRedirectUri = 'http://localhost:' + port;
                    callbackServer.listen(port, async () => {
                        await open(webUrl + '/#/sso?clientId=' + this.clientId +
                            '&redirectUri=' + encodeURIComponent(this.ssoRedirectUri) +
                            '&state=' + state + '&codeChallenge=' + codeChallenge);
                    });
                    foundPort = true;
                    break;
                } catch { }
            }
            if (!foundPort) {
                reject();
            }
        });
    }
}
