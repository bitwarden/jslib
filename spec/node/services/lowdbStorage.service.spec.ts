import { LogLevel } from '@microsoft/signalr';
import * as path from 'path';

import { ConsoleLogService } from '../../../src/cli/services/consoleLog.service';
import { LowdbStorageService } from '../../../src/services/lowdbStorage.service';

const dataFilePath = path.join(process.env.HOME, 'Desktop/test.data.json');
const key = 'key';
const data = 'data';

describe('CLI Console log service', () => {
    let logService: ConsoleLogService;
    let warningLogService: ConsoleLogService;
    let storageService: LowdbStorageService;

    beforeAll(() => {
        logService = new ConsoleLogService(true);
        warningLogService = new ConsoleLogService(false, level => level < LogLevel.Warning);
        storageService = new LowdbStorageService(logService, null, dataFilePath, false);

        storageService.save(key, data);
    });

    it('should not wipe out config', async () => {
        let i = 0;
        while (true) {
            process.stdout.write(`\r${i++}\t\t`);
            expect(await storageService.get<string>(key)).toEqual(data);
        }
    });

    it('should create and still not wipe out config', async () => {
        let i = 0;
        while (true) {
            storageService = new LowdbStorageService(warningLogService, null, dataFilePath, true);
            const read = await storageService.get<string>(key);
            process.stdout.write(`\r${i++}\t\t`);
            if (read !== data) {
                throw new Error(`data changed: expected ${data}, but got ${read}`);
            }
        }
    });
});
