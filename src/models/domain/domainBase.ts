import { CipherString } from './cipherString';

import { View } from '../view/view';

export default class Domain {
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
    protected buildDataModel<D extends Domain>(domain: D, dataObj: any, map: any, notCipherStringList: any[] = []) {
        for (const prop in map) {
            if (!map.hasOwnProperty(prop)) {
                continue;
            }

            const objProp = (domain as any)[(map[prop] || prop)];
            if (notCipherStringList.indexOf(prop) > -1) {
                (dataObj as any)[prop] = objProp != null ? objProp : null;
            } else {
                (dataObj as any)[prop] = objProp != null ? (objProp as CipherString).encryptedString : null;
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
