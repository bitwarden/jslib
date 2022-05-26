import { Injectable } from "@angular/core";
import { ActivatedRoute, CanActivate, Router } from "@angular/router";

import { AuthService } from "jslib-common/abstractions/auth.service";
import { AuthenticationStatus } from "jslib-common/enums/authenticationStatus";

@Injectable()
export class LockGuard implements CanActivate {
  protected homepage = "vault";
  protected loginpage = "login";
  constructor(
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  async canActivate() {
    const authStatus = await this.authService.getAuthStatus();

    if (authStatus === AuthenticationStatus.Locked) {
      return true;
    }

    const redirectUrl =
      authStatus === AuthenticationStatus.LoggedOut ? [this.loginpage] : [this.homepage];

    return this.router.createUrlTree([redirectUrl], { relativeTo: this.activatedRoute.root });
  }
}
