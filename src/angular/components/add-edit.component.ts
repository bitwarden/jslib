import {
    CdkDragDrop,
    moveItemInArray,
} from '@angular/cdk/drag-drop';
import {
    EventEmitter,
    Input,
    OnInit,
    Output,
} from '@angular/core';

import { CipherType } from '../../enums/cipherType';
import { EventType } from '../../enums/eventType';
import { FieldType } from '../../enums/fieldType';
import { OrganizationUserStatusType } from '../../enums/organizationUserStatusType';
import { SecureNoteType } from '../../enums/secureNoteType';
import { UriMatchType } from '../../enums/uriMatchType';

import { AuditService } from '../../abstractions/audit.service';
import { CipherService } from '../../abstractions/cipher.service';
import { CollectionService } from '../../abstractions/collection.service';
import { EventService } from '../../abstractions/event.service';
import { FolderService } from '../../abstractions/folder.service';
import { I18nService } from '../../abstractions/i18n.service';
import { MessagingService } from '../../abstractions/messaging.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';
import { StateService } from '../../abstractions/state.service';
import { UserService } from '../../abstractions/user.service';

import { Cipher } from '../../models/domain/cipher';

import { CardView } from '../../models/view/cardView';
import { CipherView } from '../../models/view/cipherView';
import { CollectionView } from '../../models/view/collectionView';
import { FieldView } from '../../models/view/fieldView';
import { FolderView } from '../../models/view/folderView';
import { IdentityView } from '../../models/view/identityView';
import { LoginUriView } from '../../models/view/loginUriView';
import { LoginView } from '../../models/view/loginView';
import { SecureNoteView } from '../../models/view/secureNoteView';

import { Utils } from '../../misc/utils';

export class AddEditComponent implements OnInit {
    @Input() folderId: string = null;
    @Input() cipherId: string;
    @Input() type: CipherType;
    @Input() collectionIds: string[];
    @Input() organizationId: string = null;
    @Output() onSavedCipher = new EventEmitter<CipherView>();
    @Output() onDeletedCipher = new EventEmitter<CipherView>();
    @Output() onCancelled = new EventEmitter<CipherView>();
    @Output() onEditAttachments = new EventEmitter<CipherView>();
    @Output() onShareCipher = new EventEmitter<CipherView>();
    @Output() onEditCollections = new EventEmitter<CipherView>();
    @Output() onGeneratePassword = new EventEmitter();

    editMode: boolean = false;
    cipher: CipherView;
    folders: FolderView[];
    collections: CollectionView[] = [];
    title: string;
    formPromise: Promise<any>;
    deletePromise: Promise<any>;
    checkPasswordPromise: Promise<number>;
    showPassword: boolean = false;
    showCardCode: boolean = false;
    cipherType = CipherType;
    fieldType = FieldType;
    addFieldType: FieldType = FieldType.Text;
    typeOptions: any[];
    cardBrandOptions: any[];
    cardExpMonthOptions: any[];
    identityTitleOptions: any[];
    addFieldTypeOptions: any[];
    uriMatchOptions: any[];
    ownershipOptions: any[] = [];

    protected writeableCollections: CollectionView[];
    private previousCipherId: string;

    constructor(protected cipherService: CipherService, protected folderService: FolderService,
        protected i18nService: I18nService, protected platformUtilsService: PlatformUtilsService,
        protected auditService: AuditService, protected stateService: StateService,
        protected userService: UserService, protected collectionService: CollectionService,
        protected messagingService: MessagingService, protected eventService: EventService) {
        this.typeOptions = [
            { name: i18nService.t('typeLogin'), value: CipherType.Login },
            { name: i18nService.t('typeCard'), value: CipherType.Card },
            { name: i18nService.t('typeIdentity'), value: CipherType.Identity },
            { name: i18nService.t('typeSecureNote'), value: CipherType.SecureNote },
        ];
        this.cardBrandOptions = [
            { name: '-- ' + i18nService.t('select') + ' --', value: null },
            { name: 'Visa', value: 'Visa' },
            { name: 'Mastercard', value: 'Mastercard' },
            { name: 'American Express', value: 'Amex' },
            { name: 'Discover', value: 'Discover' },
            { name: 'Diners Club', value: 'Diners Club' },
            { name: 'JCB', value: 'JCB' },
            { name: 'Maestro', value: 'Maestro' },
            { name: 'UnionPay', value: 'UnionPay' },
            { name: i18nService.t('other'), value: 'Other' },
        ];
        this.cardExpMonthOptions = [
            { name: '-- ' + i18nService.t('select') + ' --', value: null },
            { name: '01 - ' + i18nService.t('january'), value: '1' },
            { name: '02 - ' + i18nService.t('february'), value: '2' },
            { name: '03 - ' + i18nService.t('march'), value: '3' },
            { name: '04 - ' + i18nService.t('april'), value: '4' },
            { name: '05 - ' + i18nService.t('may'), value: '5' },
            { name: '06 - ' + i18nService.t('june'), value: '6' },
            { name: '07 - ' + i18nService.t('july'), value: '7' },
            { name: '08 - ' + i18nService.t('august'), value: '8' },
            { name: '09 - ' + i18nService.t('september'), value: '9' },
            { name: '10 - ' + i18nService.t('october'), value: '10' },
            { name: '11 - ' + i18nService.t('november'), value: '11' },
            { name: '12 - ' + i18nService.t('december'), value: '12' },
        ];
        this.identityTitleOptions = [
            { name: '-- ' + i18nService.t('select') + ' --', value: null },
            { name: i18nService.t('mr'), value: i18nService.t('mr') },
            { name: i18nService.t('mrs'), value: i18nService.t('mrs') },
            { name: i18nService.t('ms'), value: i18nService.t('ms') },
            { name: i18nService.t('dr'), value: i18nService.t('dr') },
        ];
        this.addFieldTypeOptions = [
            { name: i18nService.t('cfTypeText'), value: FieldType.Text },
            { name: i18nService.t('cfTypeHidden'), value: FieldType.Hidden },
            { name: i18nService.t('cfTypeBoolean'), value: FieldType.Boolean },
        ];
        this.uriMatchOptions = [
            { name: i18nService.t('defaultMatchDetection'), value: null },
            { name: i18nService.t('baseDomain'), value: UriMatchType.Domain },
            { name: i18nService.t('host'), value: UriMatchType.Host },
            { name: i18nService.t('startsWith'), value: UriMatchType.StartsWith },
            { name: i18nService.t('regEx'), value: UriMatchType.RegularExpression },
            { name: i18nService.t('exact'), value: UriMatchType.Exact },
            { name: i18nService.t('never'), value: UriMatchType.Never },
        ];
    }

    async ngOnInit() {
        await this.init();
    }

    async init() {
        const myEmail = await this.userService.getEmail();
        this.ownershipOptions.push({ name: myEmail, value: null });
        const orgs = await this.userService.getAllOrganizations();
        orgs.sort(Utils.getSortFunction(this.i18nService, 'name')).forEach((o) => {
            if (o.enabled && o.status === OrganizationUserStatusType.Confirmed) {
                this.ownershipOptions.push({ name: o.name, value: o.id });
            }
        });
        this.writeableCollections = await this.loadCollections();
    }

    async load() {
        this.editMode = this.cipherId != null;
        if (this.editMode) {
            this.editMode = true;
            this.title = this.i18nService.t('editItem');
        } else {
            this.title = this.i18nService.t('addItem');
        }

        const addEditCipherInfo: any = await this.stateService.get<any>('addEditCipherInfo');
        if (addEditCipherInfo != null) {
            this.cipher = addEditCipherInfo.cipher;
            this.collectionIds = addEditCipherInfo.collectionIds;
        }
        await this.stateService.remove('addEditCipherInfo');

        if (this.cipher == null) {
            if (this.editMode) {
                const cipher = await this.loadCipher();
                this.cipher = await cipher.decrypt();
            } else {
                this.cipher = new CipherView();
                this.cipher.organizationId = this.organizationId == null ? null : this.organizationId;
                this.cipher.folderId = this.folderId;
                this.cipher.type = this.type == null ? CipherType.Login : this.type;
                this.cipher.login = new LoginView();
                this.cipher.login.uris = [new LoginUriView()];
                this.cipher.card = new CardView();
                this.cipher.identity = new IdentityView();
                this.cipher.secureNote = new SecureNoteView();
                this.cipher.secureNote.type = SecureNoteType.Generic;
            }
        }

        if (this.cipher != null && (!this.editMode || addEditCipherInfo != null)) {
            await this.organizationChanged();
            if (this.collectionIds != null && this.collectionIds.length > 0 && this.collections.length > 0) {
                this.collections.forEach((c) => {
                    if (this.collectionIds.indexOf(c.id) > -1) {
                        (c as any).checked = true;
                    }
                });
            }
        }

        this.folders = await this.folderService.getAllDecrypted();

        if (this.editMode && this.previousCipherId !== this.cipherId) {
            this.eventService.collect(EventType.Cipher_ClientViewed, this.cipherId);
        }
        this.previousCipherId = this.cipherId;
    }

    async submit(): Promise<boolean> {
        if (this.cipher.name == null || this.cipher.name === '') {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('nameRequired'));
            return false;
        }

        if (!this.editMode && this.cipher.type === CipherType.Login &&
            this.cipher.login.uris != null && this.cipher.login.uris.length === 1 &&
            (this.cipher.login.uris[0].uri == null || this.cipher.login.uris[0].uri === '')) {
            this.cipher.login.uris = null;
        }

        if (!this.editMode && this.cipher.organizationId != null) {
            this.cipher.collectionIds = this.collections == null ? [] :
                this.collections.filter((c) => (c as any).checked).map((c) => c.id);
        }

        const cipher = await this.encryptCipher();
        try {
            this.formPromise = this.saveCipher(cipher);
            await this.formPromise;
            this.cipher.id = cipher.id;
            this.platformUtilsService.eventTrack(this.editMode ? 'Edited Cipher' : 'Added Cipher');
            this.platformUtilsService.showToast('success', null,
                this.i18nService.t(this.editMode ? 'editedItem' : 'addedItem'));
            this.onSavedCipher.emit(this.cipher);
            this.messagingService.send(this.editMode ? 'editedCipher' : 'addedCipher');
            return true;
        } catch { }

        return false;
    }

    addUri() {
        if (this.cipher.type !== CipherType.Login) {
            return;
        }

        if (this.cipher.login.uris == null) {
            this.cipher.login.uris = [];
        }

        this.cipher.login.uris.push(new LoginUriView());
    }

    removeUri(uri: LoginUriView) {
        if (this.cipher.type !== CipherType.Login || this.cipher.login.uris == null) {
            return;
        }

        const i = this.cipher.login.uris.indexOf(uri);
        if (i > -1) {
            this.cipher.login.uris.splice(i, 1);
        }
    }

    addField() {
        if (this.cipher.fields == null) {
            this.cipher.fields = [];
        }

        const f = new FieldView();
        f.type = this.addFieldType;
        this.cipher.fields.push(f);
    }

    removeField(field: FieldView) {
        const i = this.cipher.fields.indexOf(field);
        if (i > -1) {
            this.cipher.fields.splice(i, 1);
        }
    }

    trackByFunction(index: number, item: any) {
        return index;
    }

    cancel() {
        this.onCancelled.emit(this.cipher);
    }

    attachments() {
        this.onEditAttachments.emit(this.cipher);
    }

    share() {
        this.onShareCipher.emit(this.cipher);
    }

    editCollections() {
        this.onEditCollections.emit(this.cipher);
    }

    async delete(): Promise<boolean> {
        const confirmed = await this.platformUtilsService.showDialog(
            this.i18nService.t('deleteItemConfirmation'), this.i18nService.t('deleteItem'),
            this.i18nService.t('yes'), this.i18nService.t('no'), 'warning');
        if (!confirmed) {
            return false;
        }

        try {
            this.deletePromise = this.deleteCipher();
            await this.deletePromise;
            this.platformUtilsService.eventTrack('Deleted Cipher');
            this.platformUtilsService.showToast('success', null, this.i18nService.t('deletedItem'));
            this.onDeletedCipher.emit(this.cipher);
            this.messagingService.send('deletedCipher');
        } catch { }

        return true;
    }

    async generatePassword(): Promise<boolean> {
        if (this.cipher.login != null && this.cipher.login.password != null && this.cipher.login.password.length) {
            const confirmed = await this.platformUtilsService.showDialog(
                this.i18nService.t('overwritePasswordConfirmation'), this.i18nService.t('overwritePassword'),
                this.i18nService.t('yes'), this.i18nService.t('no'));
            if (!confirmed) {
                return false;
            }
        }

        this.onGeneratePassword.emit();
        return true;
    }

    togglePassword() {
        this.platformUtilsService.eventTrack('Toggled Password on Edit');
        this.showPassword = !this.showPassword;
        document.getElementById('loginPassword').focus();
        if (this.editMode && this.showPassword) {
            this.eventService.collect(EventType.Cipher_ClientToggledPasswordVisible, this.cipherId);
        }
    }

    toggleCardCode() {
        this.platformUtilsService.eventTrack('Toggled CardCode on Edit');
        this.showCardCode = !this.showCardCode;
        document.getElementById('cardCode').focus();
        if (this.editMode && this.showCardCode) {
            this.eventService.collect(EventType.Cipher_ClientToggledCardCodeVisible, this.cipherId);
        }
    }

    toggleFieldValue(field: FieldView) {
        const f = (field as any);
        f.showValue = !f.showValue;
        if (this.editMode && f.showValue) {
            this.eventService.collect(EventType.Cipher_ClientToggledHiddenFieldVisible, this.cipherId);
        }
    }

    toggleUriOptions(uri: LoginUriView) {
        const u = (uri as any);
        u.showOptions = u.showOptions == null && uri.match != null ? false : !u.showOptions;
    }

    loginUriMatchChanged(uri: LoginUriView) {
        const u = (uri as any);
        u.showOptions = u.showOptions == null ? true : u.showOptions;
    }

    drop(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.cipher.fields, event.previousIndex, event.currentIndex);
    }

    async organizationChanged() {
        if (this.writeableCollections != null) {
            this.writeableCollections.forEach((c) => (c as any).checked = false);
        }
        if (this.cipher.organizationId != null) {
            this.collections = this.writeableCollections.filter((c) => c.organizationId === this.cipher.organizationId);
            const org = await this.userService.getOrganization(this.cipher.organizationId);
            if (org != null) {
                this.cipher.organizationUseTotp = org.useTotp;
            }
        } else {
            this.collections = [];
        }
    }

    async checkPassword() {
        if (this.checkPasswordPromise != null) {
            return;
        }

        if (this.cipher.login == null || this.cipher.login.password == null || this.cipher.login.password === '') {
            return;
        }

        this.platformUtilsService.eventTrack('Check Password');
        this.checkPasswordPromise = this.auditService.passwordLeaked(this.cipher.login.password);
        const matches = await this.checkPasswordPromise;
        this.checkPasswordPromise = null;

        if (matches > 0) {
            this.platformUtilsService.showToast('warning', null,
                this.i18nService.t('passwordExposed', matches.toString()));
        } else {
            this.platformUtilsService.showToast('success', null, this.i18nService.t('passwordSafe'));
        }
    }

    protected async loadCollections() {
        const allCollections = await this.collectionService.getAllDecrypted();
        return allCollections.filter((c) => !c.readOnly);
    }

    protected loadCipher() {
        return this.cipherService.get(this.cipherId);
    }

    protected encryptCipher() {
        return this.cipherService.encrypt(this.cipher);
    }

    protected saveCipher(cipher: Cipher) {
        return this.cipherService.saveWithServer(cipher);
    }

    protected deleteCipher() {
        return this.cipherService.deleteWithServer(this.cipher.id);
    }
}
