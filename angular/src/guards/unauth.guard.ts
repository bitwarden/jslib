import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";

import { AuthService } from "jslib-common/abstractions/auth.service";
import { AuthenticationStatus } from "jslib-common/enums/authenticationStatus";

import { BaseGuard as BaseGuard } from "./base.guard";

@Injectable()
export class UnauthGuard extends BaseGuard implements CanActivate {
  protected homepage = "vault";
  constructor(private authService: AuthService, router: Router) {
    super(router);
  }

  async canActivate() {
    const authStatus = await this.authService.getAuthStatus();

    if (authStatus === AuthenticationStatus.LoggedOut) {
      return true;
    }

    if (authStatus === AuthenticationStatus.Locked) {
      return this.redirect("lock");
    }

    return this.redirect(this.homepage);
  }
}
