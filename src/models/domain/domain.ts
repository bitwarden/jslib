import { CipherString } from './cipherString';

import { View } from '../view';

export default abstract class Domain {
    protected buildDomainModel<D extends Domain>(domain: D, dataObj: any, map: any,
        alreadyEncrypted: boolean, notEncList: any[] = []) {
        for (const prop in map) {
            if (!map.hasOwnProperty(prop)) {
                continue;
            }

            const objProp = dataObj[(map[prop] || prop)];
            if (alreadyEncrypted === true || notEncList.indexOf(prop) > -1) {
                (domain as any)[prop] = objProp ? objProp : null;
            } else {
                (domain as any)[prop] = objProp ? new CipherString(objProp) : null;
            }
        }
    }

    protected async decryptObj<T extends View>(viewModel: T, map: any, orgId: string): Promise<T> {
        const promises = [];
        const self: any = this;

        for (const prop in map) {
            if (!map.hasOwnProperty(prop)) {
                continue;
            }

            // tslint:disable-next-line
            (function (theProp) {
                const p = Promise.resolve().then(() => {
                    const mapProp = map[theProp] || theProp;
                    if (self[mapProp]) {
                        return self[mapProp].decrypt(orgId);
                    }
                    return null;
                }).then((val: any) => {
                    (viewModel as any)[theProp] = val;
                });
                promises.push(p);
            })(prop);
        }

        await Promise.all(promises);
        return viewModel;
    }
}
