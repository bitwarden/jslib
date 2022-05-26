import { Injectable } from "@angular/core";
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from "@angular/router";

import { AuthService } from "jslib-common/abstractions/auth.service";
import { KeyConnectorService } from "jslib-common/abstractions/keyConnector.service";
import { MessagingService } from "jslib-common/abstractions/messaging.service";
import { AuthenticationStatus } from "jslib-common/enums/authenticationStatus";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private messagingService: MessagingService,
    private keyConnectorService: KeyConnectorService,
    private activatedRoute: ActivatedRoute
  ) {}

  async canActivate(route: ActivatedRouteSnapshot, routerState: RouterStateSnapshot) {
    const authStatus = await this.authService.getAuthStatus();

    if (authStatus === AuthenticationStatus.LoggedOut) {
      this.messagingService.send("authBlocked", { url: routerState.url });
      return false;
    }

    if (authStatus === AuthenticationStatus.Locked) {
      if (routerState != null) {
        this.messagingService.send("lockedUrl", { url: routerState.url });
      }
      return this.router.createUrlTree(["lock"], {
        queryParams: { promptBiometric: true },
        relativeTo: this.activatedRoute.root,
      });
    }

    if (
      !routerState.url.includes("remove-password") &&
      (await this.keyConnectorService.getConvertAccountRequired())
    ) {
      return this.router.createUrlTree(["/remove-password"], {
        relativeTo: this.activatedRoute.root,
      });
    }

    return true;
  }
}
