/**
 * Used to stub out Angular DI in CLI clients (cli and bwdc).
 * Use webpack.NormalModuleReplacementPlugin to replace @angular/core imports with this file.
 */

function noopDecorator(...args: any) {
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
