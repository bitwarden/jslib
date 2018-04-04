import { Router } from '@angular/router';

import { ToasterService } from 'angular2-toaster';
import { Angulartics2 } from 'angulartics2';

import { PasswordHintRequest } from '../../models/request/passwordHintRequest';

import { ApiService } from '../../abstractions/api.service';
import { I18nService } from '../../abstractions/i18n.service';

export class HintComponent {
    email: string = '';
    formPromise: Promise<any>;

    protected successRoute = 'login';

    constructor(protected router: Router, protected analytics: Angulartics2,
        protected toasterService: ToasterService, protected i18nService: I18nService,
        protected apiService: ApiService) { }

    async submit() {
        if (this.email == null || this.email === '') {
            this.toasterService.popAsync('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('emailRequired'));
            return;
        }
        if (this.email.indexOf('@') === -1) {
            this.toasterService.popAsync('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('invalidEmail'));
            return;
        }

        try {
            this.formPromise = this.apiService.postPasswordHint(new PasswordHintRequest(this.email));
            await this.formPromise;
            this.analytics.eventTrack.next({ action: 'Requested Hint' });
            this.toasterService.popAsync('success', null, this.i18nService.t('masterPassSent'));
            this.router.navigate([this.successRoute]);
        } catch { }
    }
}
