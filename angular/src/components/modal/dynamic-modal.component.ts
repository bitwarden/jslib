import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ComponentFactoryResolver,
    ComponentRef,
    ElementRef,
    OnDestroy,
    Type,
    ViewChild,
    ViewContainerRef
} from '@angular/core';

import { ModalRef } from './modal.ref';

@Component({
    selector: 'app-modal',
    template: '<ng-template #modalContent></ng-template>',
})
export class DynamicModalComponent implements AfterViewInit, OnDestroy {
    componentRef: ComponentRef<any>;

    @ViewChild('modalContent', { read: ViewContainerRef, static: true }) modalContentRef: ViewContainerRef;

    childComponentType: Type<any>;

    constructor(private componentFactoryResolver: ComponentFactoryResolver, private cd: ChangeDetectorRef,
        private el: ElementRef<HTMLElement>, public modalRef: ModalRef) {}

    ngAfterViewInit() {
        this.loadChildComponent(this.childComponentType);
        this.cd.detectChanges();

        this.modalRef.created(this.el.nativeElement);
    }

    loadChildComponent(componentType: Type<any>) {
        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(componentType);

        this.modalContentRef.clear();
        this.componentRef = this.modalContentRef.createComponent(componentFactory);
    }

    ngOnDestroy() {
        if (this.componentRef) {
            this.componentRef.destroy();
        }
    }

    close() {
        this.modalRef.close();
    }
}
