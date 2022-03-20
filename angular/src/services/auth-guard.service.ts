import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";

import { KeyConnectorService } from "jslib-common/abstractions/keyConnector.service";
import { MessagingService } from "jslib-common/abstractions/messaging.service";
import { StateService } from "jslib-common/abstractions/state.service";
import { VaultTimeoutService } from "jslib-common/abstractions/vaultTimeout.service";

import { BaseGuardService } from "./base-guard.service";

@Injectable()
export class AuthGuardService extends BaseGuardService implements CanActivate {
  constructor(
    protected router: Router,
    private vaultTimeoutService: VaultTimeoutService,
    private messagingService: MessagingService,
    private keyConnectorService: KeyConnectorService,
    private stateService: StateService
  ) {
    super(router);
  }

  async canActivate(route: ActivatedRouteSnapshot, routerState: RouterStateSnapshot) {
    const isAuthed = await this.stateService.getIsAuthenticated();
    if (!isAuthed) {
      this.messagingService.send("authBlocked");
      return false;
    }

    const locked = await this.vaultTimeoutService.isLocked();
    if (locked) {
      if (routerState != null) {
        this.messagingService.send("lockedUrl", { url: routerState.url });
      }
      return this.redirectNavigation("lock", { queryParams: { promptBiometric: true } });
    }

    if (
      !routerState.url.includes("remove-password") &&
      (await this.keyConnectorService.getConvertAccountRequired())
    ) {
      return this.redirectNavigation("/remove-password");
    }

    return true;
  }
}
