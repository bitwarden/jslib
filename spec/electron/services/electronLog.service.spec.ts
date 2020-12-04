import { ElectronLogService } from "../../../src/electron/services/electronLog.service";

describe('ElectronLogService', () => {
    it('sets dev based on electron method', () => {
        process.env.ELECTRON_IS_DEV = '1';
        let logService = new ElectronLogService();
        expect(logService).toEqual(jasmine.objectContaining({ isDev: true }) as any);
    })
});
