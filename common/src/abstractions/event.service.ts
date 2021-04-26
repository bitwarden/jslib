import { EventType } from '../enums/eventType';

export abstract class EventService {
    collect: (eventType: EventType, cipherId?: string, uploadImmediately?: boolean) => Promise<any>;
    uploadEvents: () => Promise<any>;
    clearEvents: () => Promise<any>;
}
