import { ConsoleLogService } from '../../src/cli/services/consoleLog.service';

const originalConsole = console;
let caughtMessage: any;

declare var console: any;

export function interceptConsole(interceptions: any): object {
    console = {
        // tslint:disable-next-line
        log: function () {
            interceptions.log = arguments;
        },
        // tslint:disable-next-line
        warn: function () {
            interceptions.warn = arguments;
        },
        // tslint:disable-next-line
        error: function () {
            interceptions.error = arguments;
        },
    };
    return interceptions;
}

export function restoreConsole() {
    console = originalConsole;
}

describe('CLI Console log service', () => {
    let logService: ConsoleLogService;
    beforeEach(() => {
        caughtMessage = {};
        interceptConsole(caughtMessage);
        logService = new ConsoleLogService(true);
    });

    afterAll(() => {
        restoreConsole();
    });

    it('should redirect all console to error if BW_RESPONSE env is true', () => {
        process.env.BW_RESPONSE = 'true';

        logService.debug('this is a debug message');
        expect(caughtMessage).toEqual({ error: jasmine.arrayWithExactContents(['this is a debug message']) });
    });

    it('should not redirect console to error if BW_RESPONSE != true', () => {
        process.env.BW_RESPONSE = 'false';

        logService.debug('debug');
        logService.info('info');
        logService.warning('warning');
        logService.error('error');

        expect(caughtMessage).toEqual({
            log: jasmine.arrayWithExactContents(['info']),
            warn: jasmine.arrayWithExactContents(['warning']),
            error: jasmine.arrayWithExactContents(['error']),
        });

    });
});
