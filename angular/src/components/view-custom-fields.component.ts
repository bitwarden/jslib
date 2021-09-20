import {
    Directive,
    Input,
} from '@angular/core';

import { EventType } from 'jslib-common/enums/eventType';
import { FieldType } from 'jslib-common/enums/fieldType';

import { EventService } from 'jslib-common/abstractions/event.service';

import { CipherView } from 'jslib-common/models/view/cipherView';
import { FieldView } from 'jslib-common/models/view/fieldView';

@Directive()
export class ViewCustomFieldsComponent {
    @Input() cipher: CipherView;
    @Input() promptPassword: () => Promise<boolean>;
    @Input() copy: (value: string, typeI18nKey: string, aType: string) => void;

    fieldType = FieldType;

    constructor(private eventService: EventService) { }

    async toggleFieldValue(field: FieldView) {
        if (!await this.promptPassword()) {
            return;
        }

        const f = (field as any);
        f.showValue = !f.showValue;
        if (f.showValue) {
            this.eventService.collect(EventType.Cipher_ClientToggledHiddenFieldVisible, this.cipher.id);
        }
    }
}
