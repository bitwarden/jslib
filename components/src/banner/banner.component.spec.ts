import { ComponentFixture, TestBed } from "@angular/core/testing";
import { I18nMockService } from "src/utils/i18n-mock.service";

import { I18nService } from "jslib-common/abstractions/i18n.service";

import { BannerComponent } from "./banner.component";

describe("BannerComponent", () => {
  let component: BannerComponent;
  let fixture: ComponentFixture<BannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BannerComponent],
      providers: [
        {
          provide: I18nService,
          useFactory: () =>
            new I18nMockService({
              warning: "Warning",
              error: "Error",
            }),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create with alert", () => {
    expect(component.useAlertRole).toBeTrue();
    const el = fixture.nativeElement.children[0];
    expect(el.getAttribute("role")).toEqual("status");
    expect(el.getAttribute("aria-live")).toEqual("polite");
  });

  it("useAlertRole=false", () => {
    component.useAlertRole = false;
    fixture.autoDetectChanges();

    expect(component.useAlertRole).toBeFalse();
    const el = fixture.nativeElement.children[0];
    expect(el.getAttribute("role")).toBeNull();
    expect(el.getAttribute("aria-live")).toBeNull();
  });
});
