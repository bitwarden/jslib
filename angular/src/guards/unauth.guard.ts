import { Injectable } from "@angular/core";
import { ActivatedRoute, CanActivate, Router } from "@angular/router";

import { AuthService } from "jslib-common/abstractions/auth.service";
import { AuthenticationStatus } from "jslib-common/enums/authenticationStatus";

@Injectable()
export class UnauthGuard implements CanActivate {
  protected homepage = "vault";
  constructor(
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  async canActivate() {
    const authStatus = await this.authService.getAuthStatus();

    if (authStatus === AuthenticationStatus.LoggedOut) {
      return true;
    }

    if (authStatus === AuthenticationStatus.Locked) {
      return this.router.createUrlTree(["lock"], { relativeTo: this.activatedRoute.root });
    }

    return this.router.createUrlTree([this.homepage], { relativeTo: this.activatedRoute.root });
  }
}
