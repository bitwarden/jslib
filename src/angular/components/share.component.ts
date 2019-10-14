import {
    EventEmitter,
    Input,
    OnInit,
    Output,
} from '@angular/core';

import { OrganizationUserStatusType } from '../../enums/organizationUserStatusType';

import { CipherService } from '../../abstractions/cipher.service';
import { CollectionService } from '../../abstractions/collection.service';
import { I18nService } from '../../abstractions/i18n.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';
import { UserService } from '../../abstractions/user.service';

import { Organization } from '../../models/domain/organization';
import { CipherView } from '../../models/view/cipherView';
import { CollectionView } from '../../models/view/collectionView';

import { Utils } from '../../misc/utils';

export class ShareComponent implements OnInit {
    @Input() cipherId: string;
    @Input() organizationId: string;
    @Output() onSharedCipher = new EventEmitter();

    formPromise: Promise<any>;
    cipher: CipherView;
    collections: CollectionView[] = [];
    organizations: Organization[] = [];

    protected writeableCollections: CollectionView[] = [];

    constructor(protected collectionService: CollectionService, protected platformUtilsService: PlatformUtilsService,
        protected i18nService: I18nService, protected userService: UserService,
        protected cipherService: CipherService) { }

    async ngOnInit() {
        await this.load();
    }

    async load() {
        const allCollections = await this.collectionService.getAllDecrypted();
        this.writeableCollections = allCollections.map((c) => c).filter((c) => !c.readOnly);
        const orgs = await this.userService.getAllOrganizations();
        this.organizations = orgs.sort(Utils.getSortFunction(this.i18nService, 'name'))
            .filter((o) => o.enabled && o.status === OrganizationUserStatusType.Confirmed);

        const cipherDomain = await this.cipherService.get(this.cipherId);
        this.cipher = await cipherDomain.decrypt();
        if (this.organizationId == null && this.organizations.length > 0) {
            this.organizationId = this.organizations[0].id;
        }
        this.filterCollections();
    }

    filterCollections() {
        this.writeableCollections.forEach((c) => (c as any).checked = false);
        if (this.organizationId == null || this.writeableCollections.length === 0) {
            this.collections = [];
        } else {
            this.collections = this.writeableCollections.filter((c) => c.organizationId === this.organizationId);
        }
    }

    async submit(): Promise<boolean> {
        const selectedCollectionIds = this.collections
            .filter((c) => !!(c as any).checked)
            .map((c) => c.id);
        if (selectedCollectionIds.length === 0) {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('selectOneCollection'));
            return;
        }

        const cipherDomain = await this.cipherService.get(this.cipherId);
        const cipherView = await cipherDomain.decrypt();

        try {
            this.formPromise = this.cipherService.shareWithServer(cipherView, this.organizationId,
                selectedCollectionIds).then(async () => {
                    this.onSharedCipher.emit();
                    this.platformUtilsService.eventTrack('Shared Cipher');
                    this.platformUtilsService.showToast('success', null, this.i18nService.t('sharedItem'));
                });
            await this.formPromise;
            return true;
        } catch { }
        return false;
    }

    get canSave() {
        if (this.collections != null) {
            for (let i = 0; i < this.collections.length; i++) {
                if ((this.collections[i] as any).checked) {
                    return true;
                }
            }
        }
        return false;
    }
}
