import { BaseResponse } from '../response/baseResponse';

export class SsoConfigApi extends BaseResponse {
    configType: string;

    // OpenId
    authority: string;
    clientId: string;
    clientSecret: string;
    metadataAddress: string;
    redirectBehavior: string;
    getClaimsFromUserInfoEndpoint: boolean;
    additionalScopes: string;
    additionalUserIdClaimTypes: string;
    additionalEmailClaimTypes: string;
    additionalNameClaimTypes: string;
    acrValues: string;
    expectedReturnAcrValue: string;

    // SAML
    spNameIdFormat: string;
    spOutboundSigningAlgorithm: string;
    spSigningBehavior: string;
    spMinIncomingSigningAlgorithm: boolean;
    spWantAssertionsSigned: boolean;
    spValidateCertificates: boolean;

    idpEntityId: string;
    idpBindingType: string;
    idpSingleSignOnServiceUrl: string;
    idpSingleLogoutServiceUrl: string;
    idpArtifactResolutionServiceUrl: string;
    idpX509PublicCert: string;
    idpOutboundSigningAlgorithm: string;
    idpAllowUnsolicitedAuthnResponse: boolean;
    idpDisableOutboundLogoutRequests: boolean;
    idpWantAuthnRequestsSigned: boolean;

    constructor(data: any = null) {
        super(data);
        if (data == null) {
            return;
        }

        this.authority = this.getResponseProperty('Authority');
        this.clientId = this.getResponseProperty('ClientId');
        this.clientSecret = this.getResponseProperty('ClientSecret');
        this.metadataAddress = this.getResponseProperty('MetadataAddress');
        this.redirectBehavior = this.getResponseProperty('RedirectBehavior');
        this.getClaimsFromUserInfoEndpoint = this.getResponseProperty('GetClaimsFromUserInfoEndpoint');
        this.additionalScopes = this.getResponseProperty('AdditionalScopes');
        this.additionalUserIdClaimTypes = this.getResponseProperty('AdditionalUserIdClaimTypes');
        this.additionalEmailClaimTypes = this.getResponseProperty('AdditionalEmailClaimTypes');
        this.additionalNameClaimTypes = this.getResponseProperty('AdditionalNameClaimTypes');
        this.acrValues = this.getResponseProperty('AcrValues');
        this.expectedReturnAcrValue = this.getResponseProperty('ExpectedReturnAcrValue');
        
        this.spNameIdFormat = this.getResponseProperty('SpNameIdFormat');
        this.spOutboundSigningAlgorithm = this.getResponseProperty('SpOutboundSigningAlgorithm');
        this.spSigningBehavior = this.getResponseProperty('SpSigningBehavior');
        this.spMinIncomingSigningAlgorithm = this.getResponseProperty('SpMinIncomingSigningAlgorithm');
        this.spWantAssertionsSigned = this.getResponseProperty('SpWantAssertionsSigned');
        this.spValidateCertificates = this.getResponseProperty('SpValidateCertificates');

        this.idpEntityId = this.getResponseProperty('IdpEntityId');
        this.idpBindingType = this.getResponseProperty('IdpBindingType');
        this.idpSingleSignOnServiceUrl = this.getResponseProperty('IdpSingleSignOnServiceUrl');
        this.idpSingleLogoutServiceUrl = this.getResponseProperty('IdpSingleLogoutServiceUrl');
        this.idpArtifactResolutionServiceUrl = this.getResponseProperty('IdpArtifactResolutionServiceUrl');
        this.idpX509PublicCert = this.getResponseProperty('IdpX509PublicCert');
        this.idpOutboundSigningAlgorithm = this.getResponseProperty('IdpOutboundSigningAlgorithm');
        this.idpAllowUnsolicitedAuthnResponse = this.getResponseProperty('IdpAllowUnsolicitedAuthnResponse');
        this.idpDisableOutboundLogoutRequests = this.getResponseProperty('IdpDisableOutboundLogoutRequests');
        this.idpWantAuthnRequestsSigned = this.getResponseProperty('IdpWantAuthnRequestsSigned');
    }
}
