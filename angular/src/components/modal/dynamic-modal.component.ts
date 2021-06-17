import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  OnDestroy,
  Type,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ModalRef } from './modal.ref';

@Component({
  selector: 'app-modal',
  template: '<ng-template #modalContent></ng-template>',
})
export class DynamicModalComponent implements AfterViewInit, OnDestroy {
  componentRef: ComponentRef<any>;

  @ViewChild('modalContent', { read: ViewContainerRef, static: true }) modalContentRef: ViewContainerRef;

  childComponentType: Type<any>;
  onClose: Observable<any>;
  private readonly _onClose = new Subject<any>();

  constructor(private componentFactoryResolver: ComponentFactoryResolver, private cd: ChangeDetectorRef, public dialogRef: ModalRef) {
    this.onClose = this._onClose.asObservable();
  }

  ngAfterViewInit() {
    this.loadChildComponent(this.childComponentType);
    this.cd.detectChanges();
  }

  onOverlayClicked(evt: MouseEvent) {
    this.dialogRef.close();
  }

  onDialogClicked(evt: MouseEvent) {
    evt.stopPropagation();
  }

  loadChildComponent(componentType: Type<any>) {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(componentType);

    this.modalContentRef.clear();
    this.componentRef = this.modalContentRef.createComponent(componentFactory);
    this.dialogRef.show();
  }

  ngOnDestroy() {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  close() {
    this._onClose.next();
  }
}
