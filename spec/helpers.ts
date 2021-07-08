// tslint:disable-next-line
const TSConsoleReporter = require('jasmine-ts-console-reporter');
jasmine.getEnv().clearReporters(); // Clear default console reporter
jasmine.getEnv().addReporter(new TSConsoleReporter());

// Polyfills
// tslint:disable-next-line
const jsdom: any = require('jsdom');
(global as any).DOMParser = new jsdom.JSDOM().window.DOMParser;
