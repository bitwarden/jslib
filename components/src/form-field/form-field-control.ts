export abstract class FormFieldControl<T> {
  abstract value: T | null;
  abstract readonly id: string;
  abstract readonly required: boolean;
  abstract readonly disabled: boolean;
  abstract readonly inError: boolean;
}
