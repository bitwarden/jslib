import { InjectFlags, InjectionToken, Injector, Type } from "@angular/core";

export class ModalInjector implements Injector {
  constructor(private _parentInjector: Injector, private _additionalTokens: WeakMap<any, any>) {}

  get<T>(token: Type<T> | InjectionToken<T>, notFoundValue?: T, flags?: InjectFlags): T;
  // eslint-disable-next-line
  get(token: any, notFoundValue?: any, flags?: any) {
    return this._additionalTokens.get(token) ?? this._parentInjector.get<any>(token, notFoundValue);
  }
}
