import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";

import { AuthService } from "jslib-common/abstractions/auth.service";
import { AuthenticationStatus } from "jslib-common/enums/authenticationStatus";

@Injectable()
export class UnauthGuardService implements CanActivate {
  protected homepage = "vault";
  constructor(private authService: AuthService, private router: Router) {}

  async canActivate() {
    const authStatus = await this.authService.authStatus();

    if (authStatus === AuthenticationStatus.LoggedOut) {
      return true;
    }

    if (authStatus === AuthenticationStatus.Locked) {
      this.router.navigate(["lock"]);
      return false;
    }

    this.router.navigate([this.homepage]);
    return false;
  }
}
