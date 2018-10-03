import { Injectable } from '@angular/core';

import { I18nService } from '../../abstractions/i18n.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';

@Injectable()
export class ValidationService {
    constructor(private i18nService: I18nService, private platformUtilsService: PlatformUtilsService) { }

    showError(data: any): string[] {
        const defaultErrorMessage = this.i18nService.t('unexpectedError');
        const errors: string[] = [];

        if (data != null && typeof data === 'string') {
            errors.push(data);
        } else if (data == null || typeof data !== 'object') {
            errors.push(defaultErrorMessage);
        } else if (data.validationErrors == null) {
            errors.push(data.message ? data.message : defaultErrorMessage);
        } else {
            for (const key in data.validationErrors) {
                if (!data.validationErrors.hasOwnProperty(key)) {
                    continue;
                }

                data.validationErrors[key].forEach((item: string) => {
                    let prefix = '';
                    if (key.indexOf('[') > -1 && key.indexOf(']') > -1) {
                        const lastSep = key.lastIndexOf('.');
                        prefix = key.substr(0, lastSep > -1 ? lastSep : key.length) + ': ';
                    }
                    errors.push(prefix + item);
                });
            }
        }

        if (errors.length === 1) {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'), errors[0]);
        } else if (errors.length > 1) {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'), errors, {
                timeout: 5000 * errors.length,
            });
        }

        return errors;
    }
}
