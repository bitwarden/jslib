import { ConfigurableFocusTrap, ConfigurableFocusTrapFactory } from "@angular/cdk/a11y";
import { Overlay, OverlayConfig, OverlayRef } from "@angular/cdk/overlay";
import { TemplatePortal } from "@angular/cdk/portal";
import { Directive, ElementRef, Input, OnDestroy, ViewContainerRef } from "@angular/core";
import { Observable, Subscription } from "rxjs";
import { filter, mergeWith } from "rxjs/operators";

import { MenuComponent } from "./menu.component";

@Directive({
  selector: "[bitMenuTriggerFor]",
  host: {
    role: "button",
    "aria-haspopup": "menu",
    "[attr.aria-expanded]": "isOpen",
    "(click)": "toggleMenu()",
  },
})
export class MenuTriggerForDirective implements OnDestroy {
  private isOpen = false;
  private overlayRef: OverlayRef;
  private defaultMenuConfig: OverlayConfig = {
    panelClass: "bit-menu-panel",
    hasBackdrop: true,
    backdropClass: "cdk-overlay-transparent-backdrop",
    scrollStrategy: this.overlay.scrollStrategies.reposition(),
    positionStrategy: this.overlay
      .position()
      .flexibleConnectedTo(this.elementRef)
      .withPositions([
        {
          originX: "start",
          originY: "bottom",
          overlayX: "start",
          overlayY: "top",
        },
      ])
      .withLockedPosition(true)
      .withFlexibleDimensions(false),
  };
  private focusTrap: ConfigurableFocusTrap;
  private closedEventsSub: Subscription = null;

  @Input("bitMenuTriggerFor") menu: MenuComponent;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private viewContainerRef: ViewContainerRef,
    private overlay: Overlay,
    private focusTrapFactory: ConfigurableFocusTrapFactory
  ) {}

  toggleMenu() {
    this.isOpen ? this.destroyMenu() : this.openMenu();
  }

  ngOnDestroy() {
    this.disposeAll();
  }

  private openMenu() {
    if (this.menu == null) {
      throw new Error("Cannot find bit-menu element");
    }

    this.isOpen = true;
    this.overlayRef = this.overlay.create(this.defaultMenuConfig);

    const templatePortal = new TemplatePortal(this.menu.templateRef, this.viewContainerRef);
    this.overlayRef.attach(templatePortal);

    this.createFocusTrap();

    this.closedEventsSub = this.getClosedEvents().subscribe(() => this.destroyMenu());
  }

  private destroyMenu() {
    if (this.overlayRef == null || !this.isOpen) {
      return;
    }

    this.isOpen = false;
    this.disposeAll();
  }

  private createFocusTrap() {
    this.focusTrap = this.focusTrapFactory.create(this.overlayRef.hostElement);

    this.focusTrap.focusFirstTabbableElementWhenReady();
  }

  private destroyFocusTrap() {
    if (this.focusTrap != null) {
      this.focusTrap.destroy();
    }
  }

  private getClosedEvents(): Observable<any> {
    const detachments = this.overlayRef.detachments();
    const escKey = this.overlayRef
      .keydownEvents()
      .pipe(filter((event: KeyboardEvent) => event.key === "Escape"));
    const backdrop = this.overlayRef.backdropClick();
    const menuClosed = this.menu.closed;

    return detachments.pipe(mergeWith(escKey, backdrop, menuClosed));
  }

  private disposeAll() {
    this.destroyFocusTrap();
    this.closedEventsSub?.unsubscribe();
    this.overlayRef?.dispose();
  }
}
