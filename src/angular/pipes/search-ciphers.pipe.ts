import {
    Pipe,
    PipeTransform,
} from '@angular/core';

import { CipherView } from '../../models/view/cipherView';

import { PlatformUtilsService } from '../../abstractions/platformUtils.service';

import { DeviceType } from '../../enums';

@Pipe({
    name: 'searchCiphers',
})
export class SearchCiphersPipe implements PipeTransform {
    private onlySearchName = false;

    constructor(platformUtilsService: PlatformUtilsService) {
        this.onlySearchName = platformUtilsService.getDevice() === DeviceType.EdgeExtension;
    }

    transform(ciphers: CipherView[], searchText: string, deleted: boolean = false): CipherView[] {
        if (ciphers == null || ciphers.length === 0) {
            return [];
        }

        if (searchText == null || searchText.length < 2) {
            return ciphers.filter((c) => {
                return deleted !== c.isDeleted;
            });
        }

        searchText = searchText.trim().toLowerCase();
        return ciphers.filter((c) => {
            if (deleted !== c.isDeleted) {
                return false;
            }
            if (c.name != null && c.name.toLowerCase().indexOf(searchText) > -1) {
                return true;
            }
            if (this.onlySearchName) {
                return false;
            }
            if (searchText.length >= 8 && c.id.startsWith(searchText)) {
                return true;
            }
            if (c.subTitle != null && c.subTitle.toLowerCase().indexOf(searchText) > -1) {
                return true;
            }
            if (c.login && c.login.uri != null && c.login.uri.toLowerCase().indexOf(searchText) > -1) {
                return true;
            }

            return false;
        });
    }
}
