import { ApiService } from "../abstractions/api.service";
import { CryptoService } from "../abstractions/crypto.service";
import { StateService } from "../abstractions/state.service";
import { UsernameGenerationService as BaseUsernameGenerationService } from "../abstractions/usernameGeneration.service";
import { EEFLongWordList } from "../misc/wordlist";

const DefaultOptions = {
  type: "word",
  wordCapitalize: true,
  wordIncludeNumber: true,
  subaddressType: "random",
  catchallType: "random",
  forwardedService: "simplelogin",
  forwardedAnonAddyDomain: "anonaddy.me",
};

export class UsernameGenerationService implements BaseUsernameGenerationService {
  constructor(
    private cryptoService: CryptoService,
    private stateService: StateService,
    private apiService: ApiService
  ) {}

  generateUsername(options: any): Promise<string> {
    if (options.type === "catchall") {
      return this.generateCatchall(options);
    } else if (options.type === "subaddress") {
      return this.generateSubaddress(options);
    } else if (options.type === "forwarded") {
      return this.generateForwarded(options);
    } else {
      return this.generateWord(options);
    }
  }

  async generateWord(options: any): Promise<string> {
    const o = Object.assign({}, DefaultOptions, options);

    if (o.wordCapitalize == null) {
      o.wordCapitalize = true;
    }
    if (o.wordIncludeNumber == null) {
      o.wordIncludeNumber = true;
    }

    const wordIndex = await this.cryptoService.randomNumber(0, EEFLongWordList.length - 1);
    let word = EEFLongWordList[wordIndex];
    if (o.wordCapitalize) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }
    if (o.wordIncludeNumber) {
      const num = await this.cryptoService.randomNumber(1, 9999);
      word = word + this.zeroPad(num.toString(), 4);
    }
    return word;
  }

  async generateSubaddress(options: any): Promise<string> {
    const o = Object.assign({}, DefaultOptions, options);

    const subaddressEmail = o.subaddressEmail;
    if (subaddressEmail == null || subaddressEmail.length < 3) {
      return o.subaddressEmail;
    }
    const atIndex = subaddressEmail.indexOf("@");
    if (atIndex < 1 || atIndex >= subaddressEmail.length - 1) {
      return subaddressEmail;
    }
    if (o.subaddressType == null) {
      o.subaddressType = "random";
    }

    const emailBeginning = subaddressEmail.substr(0, atIndex);
    const emailEnding = subaddressEmail.substr(atIndex + 1, subaddressEmail.length);

    let subaddressString = "";
    if (o.subaddressType === "random") {
      subaddressString = await this.randomString(8);
    } else if (o.subaddressType === "website-name") {
      subaddressString = o.website;
    }
    return emailBeginning + "+" + subaddressString + "@" + emailEnding;
  }

  async generateCatchall(options: any): Promise<string> {
    const o = Object.assign({}, DefaultOptions, options);

    if (o.catchallDomain == null || o.catchallDomain === "") {
      return null;
    }
    if (o.catchallType == null) {
      o.catchallType = "random";
    }

    let startString = "";
    if (o.catchallType === "random") {
      startString = await this.randomString(8);
    } else if (o.catchallType === "website-name") {
      startString = o.website;
    }
    return startString + "@" + o.catchallDomain;
  }

  async generateForwarded(options: any): Promise<string> {
    const o = Object.assign({}, DefaultOptions, options);

    if (o.forwardedService == null) {
      return null;
    }

    if (o.forwardedService === "simplelogin") {
      if (o.forwardedSimpleLoginApiKey == null || o.forwardedSimpleLoginApiKey === "") {
        return null;
      }
      return this.generateSimpleLoginAlias(o.forwardedSimpleLoginApiKey, o.website);
    } else if (o.forwardedService === "anonaddy") {
      if (
        o.forwardedAnonAddyApiToken == null ||
        o.forwardedAnonAddyApiToken === "" ||
        o.forwardedAnonAddyDomain == null ||
        o.forwardedAnonAddyDomain == ""
      ) {
        return null;
      }
      return this.generateAnonAddyAlias(
        o.forwardedAnonAddyApiToken,
        o.forwardedAnonAddyDomain,
        o.website
      );
    } else if (o.forwardedService === "firefoxrelay") {
      if (o.forwardedFirefoxApiToken == null || o.forwardedFirefoxApiToken === "") {
        return null;
      }
      return this.generateFirefoxRelayAlias(o.forwardedFirefoxApiToken, o.website);
    }

    return null;
  }

  async getOptions(): Promise<any> {
    let options = await this.stateService.getUsernameGenerationOptions();
    if (options == null) {
      options = Object.assign({}, DefaultOptions);
    } else {
      options = Object.assign({}, DefaultOptions, options);
    }
    await this.stateService.setUsernameGenerationOptions(options);
    return options;
  }

  async saveOptions(options: any) {
    await this.stateService.setUsernameGenerationOptions(options);
  }

  private async randomString(length: number) {
    let str = "";
    const charSet = "abcdefghijklmnopqrstuvwxyz1234567890";
    for (let i = 0; i < length; i++) {
      const randomCharIndex = await this.cryptoService.randomNumber(0, charSet.length - 1);
      str += charSet.charAt(randomCharIndex);
    }
    return str;
  }

  // ref: https://stackoverflow.com/a/10073788
  private zeroPad(number: string, width: number) {
    return number.length >= width
      ? number
      : new Array(width - number.length + 1).join("0") + number;
  }

  private async generateSimpleLoginAlias(apiKey: string, website: string): Promise<string> {
    if (apiKey == null || apiKey === "") {
      throw "Invalid SimpleLogin API key.";
    }
    const requestInit: RequestInit = {
      redirect: "manual",
      cache: "no-store",
      method: "POST",
      headers: new Headers({
        Authentication: apiKey,
        "Content-Type": "application/json",
      }),
    };
    let url = "https://app.simplelogin.io/api/alias/random/new";
    if (website != null) {
      url += "?hostname=" + website;
    }
    requestInit.body = JSON.stringify({
      note: (website != null ? "Website: " + website + ". " : "") + "Generated by Bitwarden.",
    });
    const request = new Request(url, requestInit);
    const response = await this.apiService.nativeFetch(request);
    if (response.status === 200 || response.status === 201) {
      const json = await response.json();
      return json.alias;
    }
    if (response.status === 401) {
      throw "Invalid SimpleLogin API key.";
    }
    try {
      const json = await response.json();
      if (json?.error != null) {
        throw "SimpleLogin error:" + json.error;
      }
    } catch {
      // Do nothing...
    }
    throw "Unknown SimpleLogin error occurred.";
  }

  private async generateAnonAddyAlias(
    apiToken: string,
    domain: string,
    websiteNote: string
  ): Promise<string> {
    if (apiToken == null || apiToken === "") {
      throw "Invalid AnonAddy API token.";
    }
    const requestInit: RequestInit = {
      redirect: "manual",
      cache: "no-store",
      method: "POST",
      headers: new Headers({
        Authorization: "Bearer " + apiToken,
        "Content-Type": "application/json",
      }),
    };
    const url = "https://app.anonaddy.com/api/v1/aliases";
    requestInit.body = JSON.stringify({
      domain: domain,
      description:
        (websiteNote != null ? "Website: " + websiteNote + ". " : "") + "Generated by Bitwarden.",
    });
    const request = new Request(url, requestInit);
    const response = await this.apiService.nativeFetch(request);
    if (response.status === 200 || response.status === 201) {
      const json = await response.json();
      return json?.data?.email;
    }
    if (response.status === 401) {
      throw "Invalid AnonAddy API token.";
    }
    throw "Unknown AnonAddy error occurred.";
  }

  private async generateFirefoxRelayAlias(apiToken: string, website: string): Promise<string> {
    if (apiToken == null || apiToken === "") {
      throw "Invalid Firefox Relay API token.";
    }
    const requestInit: RequestInit = {
      redirect: "manual",
      cache: "no-store",
      method: "POST",
      headers: new Headers({
        Authorization: "Token " + apiToken,
        "Content-Type": "application/json",
      }),
    };
    const url = "https://relay.firefox.com/api/v1/relayaddresses/";
    requestInit.body = JSON.stringify({
      enabled: true,
      generated_for: website,
      description: (website != null ? website + " - " : "") + "Generated by Bitwarden.",
    });
    const request = new Request(url, requestInit);
    const response = await this.apiService.nativeFetch(request);
    if (response.status === 200 || response.status === 201) {
      const json = await response.json();
      return json?.full_address;
    }
    if (response.status === 401) {
      throw "Invalid Firefox Relay API token.";
    }
    throw "Unknown Firefox Relay error occurred.";
  }
}
