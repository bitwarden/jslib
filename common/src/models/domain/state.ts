import { Account } from "./account";
import { GlobalState } from "./globalState";

export class State<TAccount extends Account = Account> {
  accounts: { [userId: string]: TAccount } = {};
  globals: GlobalState = new GlobalState();
  activeUserId: string;
}
