
import Substitute, { SubstituteOf } from '@fluffy-spoon/substitute';

import { KeyConnectorService } from 'jslib-common/abstractions/keyConnector.service';
import { UserVerificationService } from 'jslib-common/abstractions/userVerification.service';

import { VerifyMasterPasswordComponent } from '../../src/components/verify-master-password.component';

describe('VerifyMasterPasswordComponent: simple class tests', () => {
  let sut: VerifyMasterPasswordComponent;
  let keyConnectorService: SubstituteOf<KeyConnectorService>;
  let userVerificationService: SubstituteOf<UserVerificationService>;

  beforeEach(() => {
    keyConnectorService = Substitute.for<KeyConnectorService>();
    userVerificationService = Substitute.for<UserVerificationService>();

    sut = new VerifyMasterPasswordComponent(keyConnectorService, userVerificationService);
  });

  it('should exist', () => {
    expect(sut).toBeInstanceOf(VerifyMasterPasswordComponent);
  })
});
