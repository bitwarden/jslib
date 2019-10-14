import {
    Component,
    ComponentFactoryResolver,
    EventEmitter,
    OnDestroy,
    Output,
    Type,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';

import { MessagingService } from '../../abstractions/messaging.service';

@Component({
    selector: 'app-modal',
    template: `<ng-template #container></ng-template>`,
})
export class ModalComponent implements OnDestroy {
    @Output() onClose = new EventEmitter();
    @Output() onClosed = new EventEmitter();
    @Output() onShow = new EventEmitter();
    @Output() onShown = new EventEmitter();
    @ViewChild('container', { read: ViewContainerRef }) container: ViewContainerRef;
    parentContainer: ViewContainerRef = null;
    fade: boolean = true;

    constructor(protected componentFactoryResolver: ComponentFactoryResolver,
        protected messagingService: MessagingService) { }

    ngOnDestroy() {
        document.body.classList.remove('modal-open');
        document.body.removeChild(document.querySelector('.modal-backdrop'));
    }

    show<T>(type: Type<T>, parentContainer: ViewContainerRef, fade: boolean = true,
        setComponentParameters: (component: T) => void = null): T {
        this.onShow.emit();
        this.messagingService.send('modalShow');
        this.parentContainer = parentContainer;
        this.fade = fade;

        document.body.classList.add('modal-open');
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop' + (this.fade ? ' fade' : '');
        document.body.appendChild(backdrop);

        const factory = this.componentFactoryResolver.resolveComponentFactory<T>(type);
        const componentRef = this.container.createComponent<T>(factory);
        if (setComponentParameters != null) {
            setComponentParameters(componentRef.instance);
        }

        document.querySelector('.modal-dialog').addEventListener('click', (e: Event) => {
            e.stopPropagation();
        });

        const modals = Array.from(document.querySelectorAll('.modal, .modal *[data-dismiss="modal"]'));
        for (const closeElement of modals) {
            closeElement.addEventListener('click', (event) => {
                this.close();
            });
        }

        this.onShown.emit();
        this.messagingService.send('modalShown');
        return componentRef.instance;
    }

    close() {
        this.onClose.emit();
        this.messagingService.send('modalClose');
        this.onClosed.emit();
        this.messagingService.send('modalClosed');
        if (this.parentContainer != null) {
            this.parentContainer.clear();
        }
    }
}
