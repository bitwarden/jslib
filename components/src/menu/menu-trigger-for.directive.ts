import { Directive, ElementRef, Input, OnDestroy, ViewContainerRef, EventEmitter } from '@angular/core';
import { MenuComponent } from './menu.component';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

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
  // private menuClosingActionsSub = null;
  private defaultMenuConfig: OverlayConfig = {
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
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
    }

  @Input('bitMenuTriggerFor') menu: MenuComponent;

  constructor(private elementRef: ElementRef<HTMLElement>,
    private viewContainerRef: ViewContainerRef,
    private overlay: Overlay
  ) { }

  toggleMenu() {
    this.isOpen ? this.destroyMenu() : this.openMenu();
  }

  openMenu() {
    this.isOpen = true;
    this.overlayRef = this.overlay.create(this.defaultMenuConfig);

    const templatePortal = new TemplatePortal(
      this.menu.templateRef,
      this.viewContainerRef
    );
    this.overlayRef.attach(templatePortal);

    this.overlayRef.backdropClick().subscribe(() => this.destroyMenu());
    this.menu.closed.subscribe(() => this.destroyMenu());
    this.overlayRef.detachments().subscribe(() => this.destroyMenu());
  }

  destroyMenu() {
    if (this.overlayRef == null || !this.isOpen) {
      return;
    }

    this.isOpen = false;
    this.overlayRef.detach();
  }

  // closeMenuActions(): Observable<MouseEvent | void> {
  //   return this.menu.closed.pipe(mergeWith(
  //     this.overlayRef.backdropClick(),
  //     this.overlayRef.detachments(),
  //   ))
  // }

  ngOnDestroy() {
    if (this.overlayRef != null) {
      this.overlayRef.dispose();
    }
  }
}
