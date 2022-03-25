import { InjectionToken } from "@angular/core";

import { StateFactory } from "../factories/stateFactory";

import { StorageService } from "./storage.service";

export const STATE_SERVICE_USE_CACHE = new InjectionToken<boolean>("STATE_SERVICE_USE_CACHE");
export const STATE_FACTORY = new InjectionToken<StateFactory>("STATE_FACTORY");
export const SECURE_STORAGE = new InjectionToken<StorageService>("SECURE_STORAGE");
export const WINDOW_TOKEN = new InjectionToken<Window>("WINDOW");
