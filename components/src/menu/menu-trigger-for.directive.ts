import { Directive, ElementRef, Input, OnDestroy, ViewContainerRef, EventEmitter } from '@angular/core';
import { MenuComponent } from './menu.component';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { mergeWith } from 'rxjs/operators';

@Directive({
  selector: "[bitMenuTriggerFor]",
  host: {
    'aria-haspopup': 'menu',
    '(click)': 'toggleMenu()'
  }
})
export class MenuTriggerFor implements OnDestroy {
  private isOpen = false;
  private overlayRef: OverlayRef;
  private menuClosingActionsSub = Subscription.EMPTY;
  private defaultMenuConfig: OverlayConfig = {
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.close(),
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.elementRef)
        .withPositions([
          {
            originX: 'end',
            originY: 'bottom',
            overlayX: 'end',
            overlayY: 'top',
            offsetY: 8
          }
        ])
    }

  @Input('bitMenuTriggerFor') menu: MenuComponent;

  constructor(private overlay: Overlay, private elementRef: ElementRef<HTMLElement>,
    private viewContainerRef: ViewContainerRef) { }

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

    this.menuClosingActionsSub = this.closeMenuActions().subscribe(
      () => this.destroyMenu()
    );
  }

  destroyMenu() {
    if (this.overlayRef == null || !this.isOpen) {
      return;
    }

    this.isOpen = false;
    this.overlayRef.detach();
  }

  closeMenuActions(): Observable<MouseEvent | void> {
    return this.menu.closed.pipe(mergeWith(
      this.overlayRef.backdropClick(),
      this.overlayRef.detachments(),
    ))
  }

  ngOnDestroy() {
    if (this.overlayRef != null) {
      this.overlayRef.dispose();
    }
  }
}
