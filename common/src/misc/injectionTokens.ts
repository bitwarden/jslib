import { InjectionToken } from "@angular/core";

import { StorageService } from "../abstractions/storage.service";
import { StateFactory } from "../factories/stateFactory";


export const STATE_SERVICE_USE_CACHE = new InjectionToken<boolean>("STATE_SERVICE_USE_CACHE");
export const STATE_FACTORY = new InjectionToken<StateFactory>("STATE_FACTORY");
export const SECURE_STORAGE = new InjectionToken<StorageService>("SECURE_STORAGE");
export const WINDOW_TOKEN = new InjectionToken<Window>("WINDOW");
export const CLIENT_TYPE = new InjectionToken<Window>("CLIENT_TYPE");
export const RELOAD_CALLBACK = new InjectionToken<Window>("RELOAD_CALLBACK");
