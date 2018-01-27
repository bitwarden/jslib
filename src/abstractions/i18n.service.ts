export abstract class I18nService {
    locale: string;
    translationLocale: string;
    collator: Intl.Collator;
    t: (id: string) => string;
    translate: (id: string) => string;
}
