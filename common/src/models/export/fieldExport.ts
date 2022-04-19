import { FieldType } from "../../enums/fieldType";
import { LinkedIdType } from "../../enums/linkedIdType";
import { EncString } from "../domain/encString";
import { Field as FieldDomain } from "../domain/field";
import { FieldView } from "../view/fieldView";

export class FieldExport {
  static template(): FieldExport {
    const req = new FieldExport();
    req.name = "Field name";
    req.value = "Some value";
    req.type = FieldType.Text;
    return req;
  }

  static toView(req: FieldExport, view = new FieldView()) {
    view.type = req.type;
    view.value = req.value;
    view.name = req.name;
    view.linkedId = req.linkedId;
    return view;
  }

  static toDomain(req: FieldExport, domain = new FieldDomain()) {
    domain.type = req.type;
    domain.value = req.value != null ? new EncString(req.value) : null;
    domain.name = req.name != null ? new EncString(req.name) : null;
    domain.linkedId = req.linkedId;
    return domain;
  }

  name: string;
  value: string;
  type: FieldType;
  linkedId: LinkedIdType;

  constructor(o?: FieldView | FieldDomain) {
    if (o == null) {
      return;
    }

    if (o instanceof FieldView) {
      this.name = o.name;
      this.value = o.value;
    } else {
      this.name = o.name?.encryptedString;
      this.value = o.value?.encryptedString;
    }
    this.type = o.type;
    this.linkedId = o.linkedId;
  }
}
