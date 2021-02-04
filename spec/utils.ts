function newGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        // tslint:disable:no-bitwise
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function GetUniqueString(prefix: string = '') {
    return prefix + '_' + newGuid();
}

export function BuildTestObject<T, K extends keyof T = keyof T>(def: Partial<Pick<T, K>> | T, constructor?: (new () => T)): T {
    return Object.assign(constructor === null ? {} : new constructor(), def) as T;
}
