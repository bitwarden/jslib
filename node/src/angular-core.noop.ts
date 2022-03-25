function noopDecorator(target: any) {
  return;
}

export function Injectable(...args: any) {
  return noopDecorator;
}

export function Inject(...args: any) {
  return noopDecorator;
}

export function InjectionToken(...args: any): void {
  // Do nothing
}
