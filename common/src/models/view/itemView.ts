import { View } from "./view";

import { LinkedMetadata } from "../../misc/linkedFieldOption.decorator";

export abstract class ItemView implements View {
  linkedFieldOptions: Map<number, LinkedMetadata>;
  abstract get subTitle(): string;
}
