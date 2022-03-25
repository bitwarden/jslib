import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { AvatarComponent } from "./components/avatar.component";
import { CalloutComponent } from "./components/callout.component";
import { ExportScopeCalloutComponent } from "./components/export-scope-callout.component";
import { IconComponent } from "./components/icon.component";
import { BitwardenToastModule } from "./components/toastr.component";
import { VerifyMasterPasswordComponent } from "./components/verify-master-password.component";
import { A11yInvalidDirective } from "./directives/a11y-invalid.directive";
import { A11yTitleDirective } from "./directives/a11y-title.directive";
import { ApiActionDirective } from "./directives/api-action.directive";
import { AutofocusDirective } from "./directives/autofocus.directive";
import { BlurClickDirective } from "./directives/blur-click.directive";
import { BoxRowDirective } from "./directives/box-row.directive";
import { FallbackSrcDirective } from "./directives/fallback-src.directive";
import { InputStripSpacesDirective } from "./directives/input-strip-spaces.directive";
import { InputVerbatimDirective } from "./directives/input-verbatim.directive";
import { NotPremiumDirective } from "./directives/not-premium.directive";
import { SelectCopyDirective } from "./directives/select-copy.directive";
import { StopClickDirective } from "./directives/stop-click.directive";
import { StopPropDirective } from "./directives/stop-prop.directive";
import { TrueFalseValueDirective } from "./directives/true-false-value.directive";
import { ColorPasswordPipe } from "./pipes/color-password.pipe";
import { I18nPipe } from "./pipes/i18n.pipe";
import { SearchCiphersPipe } from "./pipes/search-ciphers.pipe";
import { SearchPipe } from "./pipes/search.pipe";
import { UserNamePipe } from "./pipes/user-name.pipe";

@NgModule({
  imports: [
    BitwardenToastModule.forRoot({
      maxOpened: 5,
      autoDismiss: true,
      closeButton: true,
    }),
    CommonModule,
  ],
  declarations: [
    A11yInvalidDirective,
    A11yTitleDirective,
    ApiActionDirective,
    AvatarComponent,
    AutofocusDirective,
    BlurClickDirective,
    BoxRowDirective,
    ColorPasswordPipe,
    FallbackSrcDirective,
    I18nPipe,
    InputStripSpacesDirective,
    InputVerbatimDirective,
    NotPremiumDirective,
    SearchCiphersPipe,
    SearchPipe,
    SelectCopyDirective,
    StopClickDirective,
    StopPropDirective,
    TrueFalseValueDirective,
    UserNamePipe,
    CalloutComponent,
    IconComponent,
    VerifyMasterPasswordComponent,
    ExportScopeCalloutComponent,
  ],
  exports: [
    A11yInvalidDirective,
    A11yTitleDirective,
    ApiActionDirective,
    AvatarComponent,
    AutofocusDirective,
    BitwardenToastModule,
    BlurClickDirective,
    BoxRowDirective,
    ColorPasswordPipe,
    FallbackSrcDirective,
    I18nPipe,
    InputStripSpacesDirective,
    InputVerbatimDirective,
    NotPremiumDirective,
    SearchCiphersPipe,
    SearchPipe,
    SelectCopyDirective,
    StopClickDirective,
    StopPropDirective,
    TrueFalseValueDirective,
    UserNamePipe,
    CalloutComponent,
    IconComponent,
    VerifyMasterPasswordComponent,
    ExportScopeCalloutComponent,
  ],
  providers: [UserNamePipe, SearchPipe],
})
export class JslibModule {}
