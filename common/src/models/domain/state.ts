import { Account } from "./account";
import { GlobalState } from "./globalState";

export class State {
  accounts: { [userId: string]: Account } = {};
  globals: GlobalState = new GlobalState();
  activeUserId: string;
}
