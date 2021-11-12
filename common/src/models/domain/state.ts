import { Account } from './account';
import { GlobalState } from './globalState';

export class State {
   accounts: { [userId: string]: Account } = {};
   globals: GlobalState;
   activeUserId: string;
}

