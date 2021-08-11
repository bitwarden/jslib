import {
    coerceNumberProperty,
    NumberInput,
} from '@angular/cdk/coercion';
import {
    FixedSizeVirtualScrollStrategy,
    VIRTUAL_SCROLL_STRATEGY,
} from '@angular/cdk/scrolling';
import {
    Directive,
    forwardRef,
    Input,
    OnChanges,
} from '@angular/core';

// Custom virtual scroll strategy for cdk-virtual-scroll
// Uses a sample list item to set the itemSize for FixedSizeVirtualScrollStrategy
// The use case is the same as FixedSizeVirtualScrollStrategy, but it avoids locking in pixel sizes in the template.
export class CipherListVirtualScrollStrategy extends FixedSizeVirtualScrollStrategy {
    private checkItemSizeCallback: any;
    private timeout: any;

    constructor(itemSize: number, minBufferPx: number, maxBufferPx: number, checkItemSizeCallback: any) {
        super(itemSize, minBufferPx, maxBufferPx);
        this.checkItemSizeCallback = checkItemSizeCallback;
    }

    onContentRendered() {
        if (this.timeout != null) {
            clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(this.checkItemSizeCallback, 500);
    }
}

// Following code is boilerplate adapted from fixedSizeVirtualScrollStrategy
export function _cipherListVirtualScrollStrategyFactory(cipherListDir: CipherListVirtualScroll) {
    return cipherListDir._scrollStrategy;
}

@Directive({
    selector: 'cdk-virtual-scroll-viewport[defaultItemSize]',
    providers: [{
        provide: VIRTUAL_SCROLL_STRATEGY,
        useFactory: _cipherListVirtualScrollStrategyFactory,
        deps: [forwardRef(() => CipherListVirtualScroll)],
    }],
})
export class CipherListVirtualScroll implements OnChanges {
    // tslint:disable
    static ngAcceptInputType_defaultItemSize: NumberInput;
    static ngAcceptInputType_minBufferPx: NumberInput;
    static ngAcceptInputType_maxBufferPx: NumberInput;
    // tslint:enable

    /** The default size of the items in the list (in pixels). */
    @Input()
    get defaultItemSize(): number { return this._defaultItemSize; }
    set defaultItemSize(value: number) { this._defaultItemSize = coerceNumberProperty(value); }
    _defaultItemSize = 20;

    /**
     * The minimum amount of buffer rendered beyond the viewport (in pixels).
     * If the amount of buffer dips below this number, more items will be rendered. Defaults to 100px.
     */
    @Input()
    get minBufferPx(): number { return this._minBufferPx; }
    set minBufferPx(value: number) { this._minBufferPx = coerceNumberProperty(value); }
    _minBufferPx = 100;

    /**
     * The number of pixels worth of buffer to render for when rendering new items. Defaults to 200px.
     */
    @Input()
    get maxBufferPx(): number { return this._maxBufferPx; }
    set maxBufferPx(value: number) { this._maxBufferPx = coerceNumberProperty(value); }
    _maxBufferPx = 200;

    itemSize: number = this.defaultItemSize;

    ngOnChanges() {
        this._scrollStrategy.updateItemAndBufferSize(this.itemSize, this.minBufferPx, this.maxBufferPx);
    }

    checkAndUpdateItemSize = () => {
        const sampleItem = document.querySelector('cdk-virtual-scroll-viewport .virtual-scroll-item') as HTMLElement;
        const newItemSize = sampleItem?.offsetHeight;

        if (newItemSize != null && newItemSize !== this.itemSize) {
            this.itemSize = newItemSize;
            this._scrollStrategy.updateItemAndBufferSize(this.itemSize, this.minBufferPx, this.maxBufferPx);
        }
    }

    /** The scroll strategy used by this directive. */
    _scrollStrategy = new CipherListVirtualScrollStrategy(this.itemSize, this.minBufferPx, this.maxBufferPx,
        this.checkAndUpdateItemSize);
}
