import { AppIdService } from '../abstractions/appId.service';
import { PlatformUtilsService } from '../abstractions/platformUtils.service';
import { StorageService } from '../abstractions/storage.service';

import { ConstantsService } from '../services/constants.service';

import { DeviceType } from '../enums/deviceType';

const GaObj = 'ga';

export const AnalyticsIds = {
    [DeviceType.ChromeExtension]: 'UA-81915606-6',
    [DeviceType.FirefoxExtension]: 'UA-81915606-7',
    [DeviceType.OperaExtension]: 'UA-81915606-8',
    [DeviceType.EdgeExtension]: 'UA-81915606-9',
    [DeviceType.VivaldiExtension]: 'UA-81915606-15',
    [DeviceType.SafariExtension]: 'UA-81915606-16',
    [DeviceType.WindowsDesktop]: 'UA-81915606-17',
    [DeviceType.LinuxDesktop]: 'UA-81915606-19',
    [DeviceType.MacOsDesktop]: 'UA-81915606-18',
};

export class Analytics {
    private gaTrackingId: string = null;
    private defaultDisabled = false;
    private appVersion: string;

    constructor(win: Window, private gaFilter?: () => boolean,
        private platformUtilsService?: PlatformUtilsService, private storageService?: StorageService,
        private appIdService?: AppIdService, private dependencyResolver?: () => any) {
        if (dependencyResolver != null) {
            const deps = dependencyResolver();
            if (platformUtilsService == null && deps.platformUtilsService) {
                this.platformUtilsService = deps.platformUtilsService as PlatformUtilsService;
            }
            if (storageService == null && deps.storageService) {
                this.storageService = deps.storageService as StorageService;
            }
            if (appIdService == null && deps.appIdService) {
                this.appIdService = deps.appIdService as AppIdService;
            }
        }

        this.appVersion = this.platformUtilsService.getApplicationVersion();
        this.defaultDisabled = this.platformUtilsService.getDevice() === DeviceType.FirefoxExtension ||
            this.platformUtilsService.isMacAppStore();
        this.gaTrackingId = this.platformUtilsService.analyticsId();

        (win as any).GoogleAnalyticsObject = GaObj;
        (win as any)[GaObj] = async (action: string, param1: any, param2?: any) => {
            await this.ga(action, param1, param2);
        };
    }

    async ga(action: string, param1: any, param2?: any) {
        return;

        if (this.gaFilter != null && this.gaFilter()) {
            return;
        }

        const disabled = await this.storageService.get<boolean>(ConstantsService.disableGaKey);
        if ((this.defaultDisabled && disabled == null) || disabled != null && disabled) {
            return;
        }

        if (action !== 'send' || !param1) {
            return;
        }

        const gaAnonAppId = await this.appIdService.getAnonymousAppId();
        const version = encodeURIComponent(this.appVersion);
        let message = 'v=1&tid=' + this.gaTrackingId + '&cid=' + gaAnonAppId + '&cd1=' + version;

        if (param1 === 'pageview' && param2) {
            message += this.gaTrackPageView(param2);
        } else if (typeof param1 === 'object' && param1.hitType === 'pageview') {
            message += this.gaTrackPageView(param1.page);
        } else if (param1 === 'event' && param2) {
            message += this.gaTrackEvent(param2);
        } else if (typeof param1 === 'object' && param1.hitType === 'event') {
            message += this.gaTrackEvent(param1);
        }

        const request = new XMLHttpRequest();
        request.open('POST', 'https://www.google-analytics.com/collect', true);
        request.send(message);
    }

    private gaTrackEvent(options: any) {
        return '&t=event&ec=' + (options.eventCategory ? encodeURIComponent(options.eventCategory) : 'Event') +
            '&ea=' + encodeURIComponent(options.eventAction) +
            (options.eventLabel ? '&el=' + encodeURIComponent(options.eventLabel) : '') +
            (options.eventValue ? '&ev=' + encodeURIComponent(options.eventValue) : '') +
            (options.page ? '&dp=' + this.cleanPagePath(options.page) : '');
    }

    private gaTrackPageView(pagePath: string) {
        return '&t=pageview&dp=' + this.cleanPagePath(pagePath);
    }

    private cleanPagePath(pagePath: string) {
        const paramIndex = pagePath.indexOf('?');
        if (paramIndex > -1) {
            pagePath = pagePath.substring(0, paramIndex);
        }
        if (pagePath.indexOf('!/') === 0 || pagePath.indexOf('#/') === 0) {
            pagePath = pagePath.substring(1);
        }
        const pathParts = pagePath.split('/');
        const newPathParts: string[] = [];
        pathParts.forEach((p) => {
            if (p.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
                newPathParts.push('__guid__');
            } else {
                newPathParts.push(p);
            }
        });
        return encodeURIComponent(newPathParts.join('/'));
    }
}
