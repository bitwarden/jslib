import { Injectable } from "@angular/core";

// Update icon references if there is a change in the Bitwarden Icon Font
const IconMap: any = {
  "bwi-globe": String.fromCharCode(0xe909),
  "bwi-sticky-note": String.fromCharCode(0xe90a),
  "bwi-android": String.fromCharCode(0xe944),
  "bwi-bw-folder-open-f": String.fromCharCode(0xe93e),
  "bwi-desktop": String.fromCharCode(0xe96a),
  "bwi-angle-left": String.fromCharCode(0xe96b),
  "bwi-user": String.fromCharCode(0xe900),
  "bwi-user-f": String.fromCharCode(0xe901),
  "bwi-key": String.fromCharCode(0xe902),
  "bwi-share-square": String.fromCharCode(0xe903),
  "bwi-hashtag": String.fromCharCode(0xe904),
  "bwi-clone": String.fromCharCode(0xe905),
  "bwi-list-alt": String.fromCharCode(0xe906),
  "bwi-id-card": String.fromCharCode(0xe907),
  "bwi-credit-card": String.fromCharCode(0xe908),
  "bwi-folder": String.fromCharCode(0xe90b),
  "bwi-lock": String.fromCharCode(0xe90c),
  "bwi-lock-f": String.fromCharCode(0xe90d),
  "bwi-generate": String.fromCharCode(0xe90e),
  "bwi-generate-f": String.fromCharCode(0xe90f),
  "bwi-cog": String.fromCharCode(0xe910),
  "bwi-cog-f": String.fromCharCode(0xe911),
  "bwi-check-circle": String.fromCharCode(0xe912),
  "bwi-eye-2": String.fromCharCode(0xe913),
  "bwi-pencil-square": String.fromCharCode(0xe914),
  "bwi-bookmark": String.fromCharCode(0xe915),
  "bwi-files": String.fromCharCode(0xe916),
  "bwi-trash": String.fromCharCode(0xe917),
  "bwi-plus": String.fromCharCode(0xe918),
  "bwi-star": String.fromCharCode(0xe919),
  "bwi-list": String.fromCharCode(0xe91a),
  "bwi-angle-right": String.fromCharCode(0xe91b),
  "bwi-external-link": String.fromCharCode(0xe91c),
  "bwi-refresh": String.fromCharCode(0xe91d),
  "bwi-search": String.fromCharCode(0xe91f),
  "bwi-filter": String.fromCharCode(0xe920),
  "bwi-plus-circle": String.fromCharCode(0xe921),
  "bwi-user-circle": String.fromCharCode(0xe922),
  "bwi-question-circle": String.fromCharCode(0xe923),
  "bwi-cogs": String.fromCharCode(0xe924),
  "bwi-minus-circle": String.fromCharCode(0xe925),
  "bwi-send": String.fromCharCode(0xe926),
  "bwi-send-f": String.fromCharCode(0xe927),
  "bwi-download": String.fromCharCode(0xe928),
  "bwi-pencil": String.fromCharCode(0xe929),
  "bwi-sign-out": String.fromCharCode(0xe92a),
  "bwi-share": String.fromCharCode(0xe92b),
  "bwi-clock": String.fromCharCode(0xe92c),
  "bwi-angle-down": String.fromCharCode(0xe92d),
  "bwi-caret-down": String.fromCharCode(0xe92e),
  "bwi-square": String.fromCharCode(0xe92f),
  "bwi-collection": String.fromCharCode(0xe930),
  "bwi-bank": String.fromCharCode(0xe931),
  "bwi-shield": String.fromCharCode(0xe932),
  "bwi-stop": String.fromCharCode(0xe933),
  "bwi-plus-square": String.fromCharCode(0xe934),
  "bwi-save": String.fromCharCode(0xe935),
  "bwi-sign-in": String.fromCharCode(0xe936),
  "bwi-spinner": String.fromCharCode(0xe937),
  "bwi-dollar": String.fromCharCode(0xe939),
  "bwi-check": String.fromCharCode(0xe93a),
  "bwi-check-square": String.fromCharCode(0xe93b),
  "bwi-minus-square": String.fromCharCode(0xe93c),
  "bwi-close": String.fromCharCode(0xe93d),
  "bwi-share-arrow": String.fromCharCode(0xe96c),
  "bwi-paperclip": String.fromCharCode(0xe93f),
  "bwi-bitcoin": String.fromCharCode(0xe940),
  "bwi-cut": String.fromCharCode(0xe941),
  "bwi-frown": String.fromCharCode(0xe942),
  "bwi-folder-open": String.fromCharCode(0xe943),
  "bwi-bug": String.fromCharCode(0xe946),
  "bwi-chain-broken": String.fromCharCode(0xe947),
  "bwi-dashboard": String.fromCharCode(0xe948),
  "bwi-envelope": String.fromCharCode(0xe949),
  "bwi-exclamation-circle": String.fromCharCode(0xe94a),
  "bwi-exclamation-triangle": String.fromCharCode(0xe94b),
  "bwi-caret-right": String.fromCharCode(0xe94c),
  "bwi-file-pdf": String.fromCharCode(0xe94e),
  "bwi-file-text": String.fromCharCode(0xe94f),
  "bwi-info-circle": String.fromCharCode(0xe952),
  "bwi-lightbulb": String.fromCharCode(0xe953),
  "bwi-link": String.fromCharCode(0xe954),
  "bwi-linux": String.fromCharCode(0xe956),
  "bwi-long-arrow-right": String.fromCharCode(0xe957),
  "bwi-money": String.fromCharCode(0xe958),
  "bwi-play": String.fromCharCode(0xe959),
  "bwi-reddit": String.fromCharCode(0xe95a),
  "bwi-refresh-tab": String.fromCharCode(0xe95b),
  "bwi-sitemap": String.fromCharCode(0xe95c),
  "bwi-sliders": String.fromCharCode(0xe95d),
  "bwi-tag": String.fromCharCode(0xe95e),
  "bwi-thumb-tack": String.fromCharCode(0xe95f),
  "bwi-thumbs-up": String.fromCharCode(0xe960),
  "bwi-unlock": String.fromCharCode(0xe962),
  "bwi-users": String.fromCharCode(0xe963),
  "bwi-wrench": String.fromCharCode(0xe965),
  "bwi-ban": String.fromCharCode(0xe967),
  "bwi-camera": String.fromCharCode(0xe968),
  "bwi-chevron-up": String.fromCharCode(0xe969),
  "bwi-eye-slash-2": String.fromCharCode(0xe96d),
  "bwi-file": String.fromCharCode(0xe96e),
  "bwi-paste": String.fromCharCode(0xe96f),
  "bwi-github": String.fromCharCode(0xe950),
  "bwi-facebook": String.fromCharCode(0xe94d),
  "bwi-paypal": String.fromCharCode(0xe938),
  "bwi-google": String.fromCharCode(0xe951),
  "bwi-linkedin": String.fromCharCode(0xe955),
  "bwi-discourse": String.fromCharCode(0xe91e),
  "bwi-twitter": String.fromCharCode(0xe961),
  "bwi-youtube": String.fromCharCode(0xe966),
  "bwi-windows": String.fromCharCode(0xe964),
  "bwi-apple": String.fromCharCode(0xe945),
};

@Injectable()
export class BitwardenIconsService {
  static getIconCode(icon: string): string {
    return IconMap[icon];
  }
}
