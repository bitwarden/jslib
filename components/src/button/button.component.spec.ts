import { Component } from "@angular/core";
import { TestBed, waitForAsync } from "@angular/core/testing";
import { By } from "@angular/platform-browser";

import { ButtonModule } from "./index";

describe("Button", () => {
  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [ButtonModule],
        declarations: [TestApp],
      });

      TestBed.compileComponents();
    })
  );

  it("should apply classes based on type", () => {
    const fixture = TestBed.createComponent(TestApp);

    const testAppComponent: TestApp = fixture.debugElement.componentInstance;
    const buttonDebugElement = fixture.debugElement.query(By.css("button"));
    const linkDebugElement = fixture.debugElement.query(By.css("a"));

    testAppComponent.buttonType = "primary";
    fixture.detectChanges();
    expect(buttonDebugElement.nativeElement.classList.contains("tw-bg-primary-500")).toBe(true);
    expect(linkDebugElement.nativeElement.classList.contains("tw-bg-primary-500")).toBe(true);

    testAppComponent.buttonType = "secondary";
    fixture.detectChanges();
    expect(buttonDebugElement.nativeElement.classList.contains("tw-border-text-muted")).toBe(true);
    expect(linkDebugElement.nativeElement.classList.contains("tw-border-text-muted")).toBe(true);

    testAppComponent.buttonType = "danger";
    fixture.detectChanges();
    expect(buttonDebugElement.nativeElement.classList.contains("tw-border-danger-500")).toBe(true);
    expect(linkDebugElement.nativeElement.classList.contains("tw-border-danger-500")).toBe(true);

    testAppComponent.buttonType = null;
    fixture.detectChanges();
    expect(buttonDebugElement.nativeElement.classList.contains("tw-border-text-muted")).toBe(true);
    expect(linkDebugElement.nativeElement.classList.contains("tw-border-text-muted")).toBe(true);
  });
});

@Component({
  selector: "test-app",
  template: `
    <button type="button" bit-button [buttonType]="buttonType">Button</button>
    <a href="#" bit-button [buttonType]="buttonType"> Link </a>
  `,
})
class TestApp {
  buttonType: string;
}
