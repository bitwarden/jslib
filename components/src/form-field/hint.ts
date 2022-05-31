import { Directive, Input } from "@angular/core";

let nextUniqueId = 0;

@Directive({
  selector: "bit-hint",
  host: {
    class: "bit-hint",
    "[class.text-right]": 'align === "end"',
    "[attr.id]": "id",
    "[attr.align]": "null",
  },
})
export class BitHint {
  @Input() align: "start" | "end" = "start";
  @Input() id = `bit-hint-${nextUniqueId++}`;
}
