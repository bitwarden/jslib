import { SendType } from '../../enums/sendType';
import { SendView } from '../view/sendView';
import { BrowserComponentState } from './browserComponentState';

export class BrowserSendComponentState extends BrowserComponentState {
    sends: SendView[];
    typeCounts: Map<SendType, number>;
}
