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
import { ModalRef } from './modal.ref';

@Component({
    selector: 'app-modal',
    template: '<ng-template #modalContent></ng-template>',
})
export class DynamicModalComponent implements AfterViewInit, OnDestroy {
    componentRef: ComponentRef<any>;
    
    @ViewChild('modalContent', { read: ViewContainerRef, static: true }) modalContentRef: ViewContainerRef;
    
    childComponentType: Type<any>;
    
    constructor(private componentFactoryResolver: ComponentFactoryResolver, private cd: ChangeDetectorRef, public modalRef: ModalRef) {}
    
    ngAfterViewInit() {
        this.loadChildComponent(this.childComponentType);
        this.cd.detectChanges();

        document.querySelector('.modal-dialog').addEventListener('click', (e: Event) => {
            e.stopPropagation();
        });

        const modals = Array.from(document.querySelectorAll('.modal, .modal *[data-dismiss="modal"]'));
        for (const closeElement of modals) {
            closeElement.addEventListener('click', event => {
                this.close();
            });
        }
    }
    
    onOverlayClicked(evt: MouseEvent) {
        this.close();
    }
    
    onDialogClicked(evt: MouseEvent) {
        evt.stopPropagation();
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
