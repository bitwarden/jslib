import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";

import { AuthService } from "jslib-common/abstractions/auth.service";
import { StateService } from "jslib-common/abstractions/state.service";
import { AuthenticationStatus } from "jslib-common/enums/authenticationStatus";

@Injectable()
export class LockGuardService implements CanActivate {
  protected homepage = "vault";
  protected loginpage = "login";
  constructor(
    private authService: AuthService,
    private router: Router,
    private stateService: StateService
  ) {}

  async canActivate() {
    const authStatus = await this.authService.authStatus();

    if (authStatus === AuthenticationStatus.Locked) {
      return true;
    }

    const redirectUrl =
      authStatus === AuthenticationStatus.LoggedOut ? [this.loginpage] : [this.homepage];

    this.router.navigate(redirectUrl);
    return false;
  }
}
