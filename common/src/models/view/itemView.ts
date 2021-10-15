import { View } from './view';

import { LinkedMetadata } from '../../misc/setLinkedMetadata.decorator';

export abstract class ItemView implements View {
    linkedMetadata: Map<number, LinkedMetadata>;
    abstract get subTitle(): string;
}
