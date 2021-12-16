import { Component, Input, OnChanges } from "@angular/core";

import { CipherType } from "jslib-common/enums/cipherType";

import { CipherView } from "jslib-common/models/view/cipherView";

import { EnvironmentService } from "jslib-common/abstractions/environment.service";
import { StateService } from "jslib-common/abstractions/state.service";

import { Utils } from "jslib-common/misc/utils";

import { BitwardenIconsService } from "../services/bitwarden-icons.service";

@Component({
  selector: "app-vault-icon",
  templateUrl: "icon.component.html",
})
export class IconComponent implements OnChanges {
  @Input() cipher: CipherView;
  icon: string;
  image: string;
  fallbackImage: string;
  imageEnabled: boolean;

  private iconsUrl: string;

  constructor(environmentService: EnvironmentService, private stateService: StateService) {
    this.iconsUrl = environmentService.getIconsUrl();
  }

  async ngOnChanges() {
    // Components may be re-used when using cdk-virtual-scroll. Which puts the component in a weird state,
    // to avoid this we reset all state variables.
    this.image = null;
    this.fallbackImage = null;
    this.imageEnabled = !(await this.stateService.getDisableFavicon());
    this.load();
  }

  get iconCode(): string {
    return BitwardenIconsService.getIconCode(this.icon);
  }

  protected load() {
    switch (this.cipher.type) {
      case CipherType.Login:
        this.icon = "bwi-globe";
        this.setLoginIcon();
        break;
      case CipherType.SecureNote:
        this.icon = "bwi-sticky-note";
        break;
      case CipherType.Card:
        this.icon = "bwi-credit-card";
        break;
      case CipherType.Identity:
        this.icon = "bwi-id-card";
        break;
      default:
        break;
    }
  }

  private setLoginIcon() {
    if (this.cipher.login.uri) {
      let hostnameUri = this.cipher.login.uri;
      let isWebsite = false;

      if (hostnameUri.indexOf("androidapp://") === 0) {
        this.icon = "bwi-android";
        this.image = null;
      } else if (hostnameUri.indexOf("iosapp://") === 0) {
        this.icon = "bwi-apple";
        this.image = null;
      } else if (
        this.imageEnabled &&
        hostnameUri.indexOf("://") === -1 &&
        hostnameUri.indexOf(".") > -1
      ) {
        hostnameUri = "http://" + hostnameUri;
        isWebsite = true;
      } else if (this.imageEnabled) {
        isWebsite = hostnameUri.indexOf("http") === 0 && hostnameUri.indexOf(".") > -1;
      }

      if (this.imageEnabled && isWebsite) {
        try {
          this.image = this.iconsUrl + "/" + Utils.getHostname(hostnameUri) + "/icon.png";
          this.fallbackImage = "images/fa-globe.png";
        } catch (e) {
          // Ignore error since the fallback icon will be shown if image is null.
        }
      }
    } else {
      this.image = null;
    }
  }
}
