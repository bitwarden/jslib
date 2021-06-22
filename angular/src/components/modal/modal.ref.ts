import { Observable, Subject } from 'rxjs';

export class ModalRef {

    onCreated: Observable<HTMLElement>;
    onClose: Observable<any>;
    onClosed: Observable<any>;
    onShow: Observable<any>;
    onShown: Observable<any>;

    private readonly _onCreated = new Subject<HTMLElement>();
    private readonly _onClose = new Subject<any>();
    private readonly _onClosed = new Subject<any>();
    private readonly _onShow = new Subject<any>();
    private readonly _onShown = new Subject<any>();
    private lastResult: any;

    constructor() {
        this.onCreated = this._onCreated.asObservable();
        this.onClose = this._onClose.asObservable();
        this.onClosed = this._onClosed.asObservable();
        this.onShow = this._onShow.asObservable();
        this.onShown = this._onShow.asObservable();
    }

    show() {
        this._onShow.next();
    }

    shown() {
        this._onShown.next();
    }

    close(result?: any) {
        this.lastResult = result;
        this._onClose.next(result);
    }

    closed() {
        this._onClosed.next(this.lastResult);
    }

    created(el: HTMLElement) {
        this._onCreated.next(el);
    }
}
