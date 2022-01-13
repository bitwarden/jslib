import { AuthRequestType } from "../../enums/authRequestType";

export class AuthRequestCreateRequest {
  email: string;
  publicKey: string;
  deviceIdentifier: string;
  accessCode: string;
  type: AuthRequestType;
}
