import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";

import { StateService } from "jslib-common/abstractions/state.service";
import { VaultTimeoutService } from "jslib-common/abstractions/vaultTimeout.service";

@Injectable()
export class UnauthGuardService implements CanActivate {
  protected homepage = "vault";
  constructor(
    private vaultTimeoutService: VaultTimeoutService,
    private router: Router,
    private stateService: StateService
  ) {}

  async canActivate() {
    const isAuthed = await this.stateService.getIsAuthenticated();
    if (isAuthed) {
      const locked = await this.vaultTimeoutService.isLocked();
      if (locked) {
        return this.router.createUrlTree(["lock"]);
      }
      return this.router.createUrlTree([this.homepage]);
    }
    return true;
  }
}
