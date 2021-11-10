import { BaseResponse } from '../response/baseResponse';

enum SsoType {
    OpenIdConnect = 1,
    Saml2 = 2,
}

enum OpenIdConnectRedirectBehavior {
    RedirectGet = 0,
    FormPost = 1,
}

enum Saml2BindingType {
    HttpRedirect = 1,
    HttpPost = 2,
    Artifact = 4,
}

enum Saml2NameIdFormat {
    NotConfigured = 0,
    Unspecified = 1,
    EmailAddress = 2,
    X509SubjectName = 3,
    WindowsDomainQualifiedName = 4,
    KerberosPrincipalName = 5,
    EntityIdentifier = 6,
    Persistent = 7,
    Transient = 8,
}

enum Saml2SigningBehavior {
    IfIdpWantAuthnRequestsSigned = 0,
    Always = 1,
    Never = 3,
}

export class SsoConfigApi extends BaseResponse {
    configType: SsoType;

    useCryptoAgent: boolean;
    cryptoAgentUrl: string;

    // OpenId
    authority: string;
    clientId: string;
    clientSecret: string;
    metadataAddress: string;
    redirectBehavior: OpenIdConnectRedirectBehavior;
    getClaimsFromUserInfoEndpoint: boolean;
    additionalScopes: string;
    additionalUserIdClaimTypes: string;
    additionalEmailClaimTypes: string;
    additionalNameClaimTypes: string;
    acrValues: string;
    expectedReturnAcrValue: string;

    // SAML
    spNameIdFormat: Saml2NameIdFormat;
    spOutboundSigningAlgorithm: string;
    spSigningBehavior: Saml2SigningBehavior;
    spMinIncomingSigningAlgorithm: boolean;
    spWantAssertionsSigned: boolean;
    spValidateCertificates: boolean;

    idpEntityId: string;
    idpBindingType: Saml2BindingType;
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

        this.configType = this.getResponseProperty('ConfigType');

        this.useCryptoAgent = this.getResponseProperty('UseCryptoAgent');
        this.cryptoAgentUrl = this.getResponseProperty('CryptoAgentUrl');

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
