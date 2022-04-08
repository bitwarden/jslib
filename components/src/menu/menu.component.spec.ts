import { Component } from "@angular/core";
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { By } from "@angular/platform-browser";

import { MenuTriggerForDirective } from "./menu-trigger-for.directive";

import { MenuModule } from "./index";

describe("Menu", () => {
  let fixture: ComponentFixture<TestApp>;
  const getMenuTriggerDirective = () => {
    const buttonDebugElement = fixture.debugElement.query(By.directive(MenuTriggerForDirective));
    return buttonDebugElement.injector.get(MenuTriggerForDirective);
  };

  // The overlay is created outside the root debugElement, so we need to query its parent
  const getBitMenuPanel = () => fixture.debugElement.parent.query(By.css(".bit-menu-panel"));

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [MenuModule],
        declarations: [TestApp],
      });

      TestBed.compileComponents();

      fixture = TestBed.createComponent(TestApp);
      fixture.detectChanges();
    })
  );

  it("should open when the trigger is clicked", () => {
    const buttonDebugElement = fixture.debugElement.query(By.directive(MenuTriggerForDirective));
    (buttonDebugElement.nativeElement as HTMLButtonElement).click();

    expect(getBitMenuPanel()).toBeTruthy();
  });

  it("should close when the trigger is clicked", () => {
    getMenuTriggerDirective().toggleMenu();

    const buttonDebugElement = fixture.debugElement.query(By.directive(MenuTriggerForDirective));
    (buttonDebugElement.nativeElement as HTMLButtonElement).click();

    expect(getBitMenuPanel()).toBeFalsy();
  });

  it("should close when a menu item is clicked", () => {
    getMenuTriggerDirective().toggleMenu();

    fixture.debugElement.parent.query(By.css("#item1")).nativeElement.click();

    expect(getBitMenuPanel()).toBeFalsy();
  });

  it("should close when the backdrop is clicked", () => {
    getMenuTriggerDirective().toggleMenu();

    fixture.debugElement.parent.query(By.css(".cdk-overlay-backdrop")).nativeElement.click();

    expect(getBitMenuPanel()).toBeFalsy();
  });
});

@Component({
  selector: "test-app",
  template: `
    <button type="button" [bitMenuTriggerFor]="testMenu" class="testclass">Open menu</button>

    <bit-menu #testMenu>
      <a id="item1" bit-menu-item>Item 1</a>
      <a id="item2" bit-menu-item>Item 2</a>
    </bit-menu>
  `,
})
class TestApp {}
