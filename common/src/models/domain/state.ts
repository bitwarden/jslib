import { Account } from "./account";
import { GlobalState } from "./globalState";

export class State<
  TAccount extends Account = Account,
  TGlobalState extends GlobalState = GlobalState
> {
  accounts: { [userId: string]: TAccount } = {};
  globals: TGlobalState;
  activeUserId: string;
  authenticatedAccounts: string[] = [];

  constructor(globals: TGlobalState) {
    this.globals = globals;
  }
}
