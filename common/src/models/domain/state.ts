import { Account } from './account';
import { Globals } from './globals';

export class State {
   accounts: { [userId: string]: Account } = {};
   globals: Globals;
   activeUserId: string;
}

