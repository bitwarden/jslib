import { Directive, ElementRef, Input, OnDestroy, ViewContainerRef, EventEmitter } from '@angular/core';
import { MenuComponent } from './menu.component';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ConfigurableFocusTrap, ConfigurableFocusTrapFactory } from "@angular/cdk/a11y";

import { filter } from 'rxjs';

@Directive({
  selector: "[bitMenuTriggerFor]",
  host: {
    'aria-haspopup': 'menu',
    '(click)': 'toggleMenu()'
  }
})
export class MenuTriggerForDirective implements OnDestroy {
  private isOpen = false;
  private overlayRef: OverlayRef;
  private defaultMenuConfig: OverlayConfig = {
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.elementRef)
        .withPositions([
          {
            originX: 'start',
            originY: 'bottom',
            overlayX: 'start',
            overlayY: 'top',
          }
        ])
        .withLockedPosition(true)
        .withFlexibleDimensions(false)
    }
  private focusTrap: ConfigurableFocusTrap;

  @Input('bitMenuTriggerFor') menu: MenuComponent;

  constructor(private elementRef: ElementRef<HTMLElement>,
    private viewContainerRef: ViewContainerRef,
    private overlay: Overlay,
    private focusTrapFactory: ConfigurableFocusTrapFactory
  ) { }

  toggleMenu() {
    this.isOpen ? this.destroyMenu() : this.openMenu();
  }

  ngOnDestroy() {
    if (this.overlayRef != null) {
      this.overlayRef.dispose();
    }

    this.destroyFocusTrap();
  }

  private openMenu() {
    this.isOpen = true;
    this.overlayRef = this.overlay.create(this.defaultMenuConfig);

    const templatePortal = new TemplatePortal(
      this.menu.templateRef,
      this.viewContainerRef
    );
    this.overlayRef.attach(templatePortal);

    this.createFocusTrap();

    // TODO: track and unsubscribe from these
    this.overlayRef.backdropClick().subscribe(() => this.destroyMenu());
    this.menu.closed.subscribe(() => this.destroyMenu());
    this.overlayRef.detachments().subscribe(() => this.destroyMenu());
    this.overlayRef.keydownEvents().pipe(filter((event: KeyboardEvent) => event.key === "Escape")).subscribe(() => this.destroyMenu())
  }

  private destroyMenu() {
    if (this.overlayRef == null || !this.isOpen) {
      return;
    }

    this.isOpen = false;
    this.destroyFocusTrap();

    this.overlayRef.dispose();
    // Alternative if we want to hide but not destroy the DOM elements:
    // this.overlayRef.detach();
    // But then we need to handle attaching a pre-existing overlayRef instead of creating a new one
    // Ref: https://github.com/angular/components/blob/master/src/cdk/overlay/overlay-directives.ts#L406
  }

  private createFocusTrap() {
    this.focusTrap = this.focusTrapFactory.create(
      this.overlayRef.hostElement
    );

    this.focusTrap.focusFirstTabbableElementWhenReady();
  }

  private destroyFocusTrap() {
    if (this.focusTrap != null) {
      this.focusTrap.destroy();
    }
  }
}
