import { MessagingService } from "../abstractions/messaging.service";

export class NoopMessagingService implements MessagingService {
  // eslint-disable-next-line
  send(subscriber: string, arg: any = {}) {
    // Do nothing...
  }
}
