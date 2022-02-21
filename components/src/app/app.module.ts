import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { I18nService as I18nServiceAbstraction } from "jslib-common/abstractions/i18n.service";
import { I18nService } from "jslib-common/services/i18n.service";

import { AppComponent } from "./app.component";

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, CommonModule],
  providers: [
    {
      provide: I18nServiceAbstraction,
      useFactory: (window: Window) =>
        new I18nService(window.navigator.language, "locales", async (formattedLocale) => {
          const filePath = "locales/" + formattedLocale + "/messages.json";
          const localesResult = await fetch(filePath);
          const locales = await localesResult.json();
          return locales;
        }),
      deps: ["WINDOW"],
    },
    { provide: "WINDOW", useValue: window },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
