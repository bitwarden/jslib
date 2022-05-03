import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";

import { AuthService } from "jslib-common/abstractions/auth.service";
import { AuthenticationStatus } from "jslib-common/enums/authenticationStatus";

import { BaseGuard } from "./base.guard";

@Injectable()
export class LockGuard extends BaseGuard implements CanActivate {
  protected homepage = "vault";
  protected loginpage = "login";
  constructor(private authService: AuthService, router: Router) {
    super(router);
  }

  async canActivate() {
    const authStatus = await this.authService.getAuthStatus();

    if (authStatus === AuthenticationStatus.Locked) {
      return true;
    }

    const redirectUrl =
      authStatus === AuthenticationStatus.LoggedOut ? [this.loginpage] : [this.homepage];

    return this.redirect(redirectUrl);
  }
}
