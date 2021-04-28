import * as program from 'commander';
import * as http from 'http';
import * as inquirer from 'inquirer';

import { TwoFactorProviderType } from 'jslib-common/enums/twoFactorProviderType';

import { AuthResult } from 'jslib-common/models/domain/authResult';
import { TwoFactorEmailRequest } from 'jslib-common/models/request/twoFactorEmailRequest';

import { ApiService } from 'jslib-common/abstractions/api.service';
import { AuthService } from 'jslib-common/abstractions/auth.service';
import { CryptoFunctionService } from 'jslib-common/abstractions/cryptoFunction.service';
import { EnvironmentService } from 'jslib-common/abstractions/environment.service';
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { PasswordGenerationService } from 'jslib-common/abstractions/passwordGeneration.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';

import { Response } from '../models/response';

import { MessageResponse } from '../models/response/messageResponse';

import { NodeUtils } from 'jslib-common/misc/nodeUtils';
import { Utils } from 'jslib-common/misc/utils';

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
        protected cryptoFunctionService: CryptoFunctionService, protected platformUtilsService: PlatformUtilsService,
        clientId: string) {
        this.clientId = clientId;
    }

    async run(email: string, password: string, options: program.OptionValues) {
        this.canInteract = process.env.BW_NOINTERACTION !== 'true';

        let ssoCodeVerifier: string = null;
        let ssoCode: string = null;

        let clientId: string = null;
        let clientSecret: string = null;

        if (options.apikey != null) {
            const storedClientId: string = process.env.BW_CLIENTID;
            const storedClientSecret: string = process.env.BW_CLIENTSECRET;
            if (storedClientId == null) {
                if (this.canInteract) {
                    const answer: inquirer.Answers = await inquirer.createPromptModule({ output: process.stderr })({
                        type: 'input',
                        name: 'clientId',
                        message: 'client_id:',
                    });
                    clientId = answer.clientId;
                } else {
                    clientId = null;
                }
            } else {
                clientId = storedClientId;
            }
            if (this.canInteract && storedClientSecret == null) {
                const answer: inquirer.Answers = await inquirer.createPromptModule({ output: process.stderr })({
                    type: 'input',
                    name: 'clientSecret',
                    message: 'client_secret:',
                });
                clientSecret = answer.clientSecret;
            } else {
                clientSecret = storedClientSecret;
            }
        } else if (options.sso != null && this.canInteract) {
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
                if (options.passwordfile) {
                    password = await NodeUtils.readFirstLine(options.passwordfile);
                } else if (options.passwordenv && process.env[options.passwordenv]) {
                    password = process.env[options.passwordenv];
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

        let twoFactorToken: string = options.code;
        let twoFactorMethod: TwoFactorProviderType = null;
        try {
            if (options.method != null) {
                twoFactorMethod = parseInt(options.method, null);
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
                if (clientId != null && clientSecret != null) {
                    response = await this.authService.logInApiKeyComplete(clientId, clientSecret, twoFactorMethod,
                        twoFactorToken, false);
                } else if (ssoCode != null && ssoCodeVerifier != null) {
                    response = await this.authService.logInSsoComplete(ssoCode, ssoCodeVerifier, this.ssoRedirectUri,
                        twoFactorMethod, twoFactorToken, false);
                } else {
                    response = await this.authService.logInComplete(email, password, twoFactorMethod,
                        twoFactorToken, false);
                }
            } else {
                if (clientId != null && clientSecret != null) {
                    response = await this.authService.logInApiKey(clientId, clientSecret);
                } else if (ssoCode != null && ssoCodeVerifier != null) {
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
                            selectedProvider = twoFactorProviders.filter(p => p.type === twoFactorMethod)[0];
                        } catch (e) {
                            return Response.error('Invalid two-step login method.');
                        }
                    }

                    if (selectedProvider == null) {
                        if (twoFactorProviders.length === 1) {
                            selectedProvider = twoFactorProviders[0];
                        } else if (this.canInteract) {
                            const twoFactorOptions = twoFactorProviders.map(p => p.name);
                            twoFactorOptions.push(new inquirer.Separator());
                            twoFactorOptions.push('Cancel');
                            const answer: inquirer.Answers =
                                await inquirer.createPromptModule({ output: process.stderr })({
                                    type: 'list',
                                    name: 'method',
                                    message: 'Two-step login method:',
                                    choices: twoFactorOptions,
                                });
                            const i = twoFactorOptions.indexOf(answer.method);
                            if (i === (twoFactorOptions.length - 1)) {
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
                return Response.error('In order to log in with SSO from the CLI, you must first log in' +
                    ' through the web vault to set your master password.');
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
                if (code != null && receivedState != null && this.checkState(receivedState, state)) {
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
            let webUrl = this.environmentService.getWebVaultUrl();
            if (webUrl == null) {
                webUrl = 'https://vault.bitwarden.com';
            }
            for (let port = 8065; port <= 8070; port++) {
                try {
                    this.ssoRedirectUri = 'http://localhost:' + port;
                    callbackServer.listen(port, () => {
                        this.platformUtilsService.launchUri(webUrl + '/#/sso?clientId=' + this.clientId +
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

    private checkState(state: string, checkState: string): boolean {
        if (state === null || state === undefined) {
            return false;
        }
        if (checkState === null || checkState === undefined) {
            return false;
        }

        const stateSplit = state.split('_identifier=');
        const checkStateSplit = checkState.split('_identifier=');
        return stateSplit[0] === checkStateSplit[0];
    }
}
