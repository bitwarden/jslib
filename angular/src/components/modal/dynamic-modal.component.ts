import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ComponentRef,
    ElementRef,
    OnDestroy,
    Type,
    ViewChild,
    ViewContainerRef
} from '@angular/core';

import { ModalService } from '../../services/modal.service';

import { ModalRef } from './modal.ref';

@Component({
    selector: 'app-modal',
    template: '<ng-template #modalContent></ng-template>',
})
export class DynamicModalComponent implements AfterViewInit, OnDestroy {
    componentRef: ComponentRef<any>;

    @ViewChild('modalContent', { read: ViewContainerRef, static: true }) modalContentRef: ViewContainerRef;

    childComponentType: Type<any>;
    setComponentParameters: (component: any) => void;

    constructor(private modalService: ModalService, private cd: ChangeDetectorRef,
        private el: ElementRef<HTMLElement>, public modalRef: ModalRef) {}

    ngAfterViewInit() {
        this.loadChildComponent(this.childComponentType);
        if (this.setComponentParameters != null) {
            this.setComponentParameters(this.componentRef.instance);
        }
        this.cd.detectChanges();

        this.modalRef.created(this.el.nativeElement);
    }

    loadChildComponent(componentType: Type<any>) {
        const componentFactory = this.modalService.resolveComponentFactory(componentType);

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
