import {
    ApplicationRef,
    ComponentFactoryResolver,
    ComponentRef,
    EmbeddedViewRef,
    Injectable,
    Injector,
    Type
} from '@angular/core';

import { first } from 'rxjs/operators';
import { DynamicModalComponent } from '../components/modal/dynamic-modal.component';
import { ModalInjector } from '../components/modal/modal-injector';
import { ModalRef } from '../components/modal/modal.ref';

export class ModalConfig<D = any> {
    data?: D;
}

@Injectable()
export class ModalService {
    dialogComponentRef: ComponentRef<DynamicModalComponent>;

    constructor(private componentFactoryResolver: ComponentFactoryResolver, private applicationRef: ApplicationRef,
        private injector: Injector) {}

    open(componentType: Type<any>, config: ModalConfig) {
        const modalRef = this.appendModalComponentToBody(config);

        modalRef.onClose.subscribe(() => {
            modalRef.closed();
        });

        this.dialogComponentRef.instance.childComponentType = componentType;        

        return modalRef;
    }

    private appendModalComponentToBody(config: ModalConfig) {
        const map = new WeakMap();
        map.set(ModalConfig, config);

        const modalRef = new ModalRef();
        map.set(ModalRef, modalRef);

        modalRef.onClosed.pipe(first()).subscribe(() => {
            this.removeModalComponentFromBody();
        });

        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(DynamicModalComponent);
        const componentRef = componentFactory.create(new ModalInjector(this.injector, map));

        this.applicationRef.attachView(componentRef.hostView);

        const domElem = (componentRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;
        document.body.appendChild(domElem);

        this.dialogComponentRef = componentRef;

        return modalRef;
    }

    private removeModalComponentFromBody() {
        this.applicationRef.detachView(this.dialogComponentRef.hostView);
        this.dialogComponentRef.destroy();
    }
}
