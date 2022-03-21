import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";

import { StateService } from "jslib-common/abstractions/state.service";
import { VaultTimeoutService } from "jslib-common/abstractions/vaultTimeout.service";

import { BaseGuardService } from "./base-guard.service";

@Injectable()
export class UnauthGuardService extends BaseGuardService implements CanActivate {
  protected homepage = "vault";
  constructor(
    router: Router,
    private vaultTimeoutService: VaultTimeoutService,
    private stateService: StateService
  ) {
    super(router);
  }

  async canActivate() {
    const isAuthed = await this.stateService.getIsAuthenticated();
    if (isAuthed) {
      const locked = await this.vaultTimeoutService.isLocked();
      if (locked) {
        return this.redirect("lock");
      } else {
        return this.redirect(this.homepage);
      }
    }
    return true;
  }
}
