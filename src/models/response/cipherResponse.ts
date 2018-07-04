import { AttachmentResponse } from './attachmentResponse';

import { CardApi } from '../api/cardApi';
import { FieldApi } from '../api/fieldApi';
import { IdentityApi } from '../api/identityApi';
import { LoginApi } from '../api/loginApi';
import { SecureNoteApi } from '../api/secureNoteApi';

export class CipherResponse {
    id: string;
    organizationId: string;
    folderId: string;
    type: number;
    name: string;
    notes: string;
    fields: FieldApi[];
    login: LoginApi;
    card: CardApi;
    identity: IdentityApi;
    secureNote: SecureNoteApi;
    favorite: boolean;
    edit: boolean;
    organizationUseTotp: boolean;
    revisionDate: Date;
    attachments: AttachmentResponse[];
    collectionIds: string[];

    constructor(response: any) {
        this.id = response.Id;
        this.organizationId = response.OrganizationId;
        this.folderId = response.FolderId || null;
        this.type = response.Type;
        this.name = response.Name;
        this.notes = response.Notes;
        this.favorite = response.Favorite || false;
        this.edit = response.Edit || true;
        this.organizationUseTotp = response.OrganizationUseTotp;
        this.revisionDate = new Date(response.RevisionDate);

        if (response.Login != null) {
            this.login = new LoginApi(response.Login);
        }

        if (response.Card != null) {
            this.card = new CardApi(response.Card);
        }

        if (response.Identity != null) {
            this.identity = new IdentityApi(response.Identity);
        }

        if (response.SecureNote != null) {
            this.secureNote = new SecureNoteApi(response.SecureNote);
        }

        if (response.Fields != null) {
            this.fields = [];
            response.Fields.forEach((field: any) => {
                this.fields.push(new FieldApi(field));
            });
        }

        if (response.Attachments != null) {
            this.attachments = [];
            response.Attachments.forEach((attachment: any) => {
                this.attachments.push(new AttachmentResponse(attachment));
            });
        }

        if (response.CollectionIds) {
            this.collectionIds = [];
            response.CollectionIds.forEach((id: string) => {
                this.collectionIds.push(id);
            });
        }
    }
}
