import { InjectionToken } from '@angular/core';
import { StateFactory } from '../factories/stateFactory';

export const STATE_SERVICE_USE_CACHE = new InjectionToken<boolean>('STATE_SERVICE_USE_CACHE');
export const STATE_FACTORY = new InjectionToken<StateFactory>('STATE_FACTORY');
