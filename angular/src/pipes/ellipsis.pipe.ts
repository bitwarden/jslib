import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "ellipsis",
})
export class EllipsisPipe implements PipeTransform {
  transform(value: string, limit = 25, completeWords = false, ellipsis = "...") {
    limit -= ellipsis.length;
    if (completeWords && value.length > limit) {
      if (value.indexOf(" ") > 0) {
        limit = value.substring(0, limit).lastIndexOf(" ");
      }
    }
    return value.length > limit ? value.substring(0, limit) + ellipsis : value;
  }
}
