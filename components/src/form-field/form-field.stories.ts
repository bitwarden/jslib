import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { Meta, moduleMetadata, Story } from "@storybook/angular";
import { InputModule } from "src/input/input.module";
import { I18nMockService } from "src/utils/i18n-mock.service";

import { I18nService } from "jslib-common/abstractions/i18n.service";

import { ButtonModule } from "../button";

import { BitFormFieldComponent } from "./form-field.component";
import { FormFieldModule } from "./form-field.module";

export default {
  title: "Jslib/Form Field",
  component: BitFormFieldComponent,
  decorators: [
    moduleMetadata({
      imports: [FormsModule, ReactiveFormsModule, FormFieldModule, InputModule, ButtonModule],
      providers: [
        {
          provide: I18nService,
          useFactory: () => {
            return new I18nMockService({
              required: "required",
              inputRequired: "Input is required.",
              inputEmail: "Input is not an email-address.",
            });
          },
        },
      ],
    }),
  ],
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/f32LSg3jaegICkMu7rPARm/Tailwind-Component-Library-Update?node-id=1881%3A17689",
    },
  },
} as Meta;

const fb = new FormBuilder();
const formObj = fb.group({
  test: [""],
  required: ["", [Validators.required]],
});

const defaultFormObj = fb.group({
  name: ["", [Validators.required]],
  email: ["", [Validators.required, Validators.email, forbiddenNameValidator(/bit/i)]],
});

// Custom error message, `message` is shown as the error message
function forbiddenNameValidator(nameRe: RegExp): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const forbidden = nameRe.test(control.value);
    return forbidden ? { forbiddenName: { message: "forbiddenName" } } : null;
  };
}

function submit() {
  defaultFormObj.markAllAsTouched();
}

const Template: Story<BitFormFieldComponent> = (args: BitFormFieldComponent) => ({
  props: {
    formObj: defaultFormObj,
    submit: submit,
    ...args,
  },
  template: `
    <form [formGroup]="formObj" (ngSubmit)="submit()">
      <bit-form-field>
        <bit-label>Name</bit-label>
        <input bitInput formControlName="name" />
      </bit-form-field>

      <bit-form-field>
        <bit-label>Email</bit-label>
        <input bitInput formControlName="email" />
      </bit-form-field>

      <button type="submit" bitButton buttonType="primary">Submit</button>
    </form>
  `,
});

export const Default = Template.bind({});
Default.props = {};

const RequiredTemplate: Story<BitFormFieldComponent> = (args: BitFormFieldComponent) => ({
  props: {
    formObj: formObj,
    ...args,
  },
  template: `
    <bit-form-field>
      <bit-label>Label</bit-label>
      <input bitInput required placeholder="Placeholder" />
    </bit-form-field>

    <bit-form-field [formGroup]="formObj">
      <bit-label>FormControl</bit-label>
      <input bitInput formControlName="required" placeholder="Placeholder" />
    </bit-form-field>
  `,
});

export const Required = RequiredTemplate.bind({});
Required.props = {};

const HintTemplate: Story<BitFormFieldComponent> = (args: BitFormFieldComponent) => ({
  props: {
    formObj: formObj,
    ...args,
  },
  template: `
    <bit-form-field [formGroup]="formObj">
      <bit-label>FormControl</bit-label>
      <input bitInput formControlName="required" placeholder="Placeholder" />
      <bit-hint>Long hint text</bit-hint>
    </bit-form-field>
  `,
});

export const Hint = HintTemplate.bind({});
Required.props = {};

const DisabledTemplate: Story<BitFormFieldComponent> = (args: BitFormFieldComponent) => ({
  props: args,
  template: `
    <bit-form-field>
      <bit-label>Label</bit-label>
      <input bitInput placeholder="Placeholder" disabled />
    </bit-form-field>
  `,
});

export const Disabled = DisabledTemplate.bind({});
Disabled.args = {};

const GroupTemplate: Story<BitFormFieldComponent> = (args: BitFormFieldComponent) => ({
  props: args,
  template: `
    <bit-form-field>
      <bit-label>Label</bit-label>
      <input bitInput placeholder="Placeholder" />
      <span bitPrefix>$</span>
      <span bitSuffix>USD</span>
    </bit-form-field>
  `,
});

export const InputGroup = GroupTemplate.bind({});
InputGroup.args = {};

const ButtonGroupTemplate: Story<BitFormFieldComponent> = (args: BitFormFieldComponent) => ({
  props: args,
  template: `
    <bit-form-field>
      <bit-label>Label</bit-label>
      <input bitInput placeholder="Placeholder" />
      <button bitPrefix bitButton>Button</button>
      <button bitPrefix bitButton>Button</button>
      <button bitSuffix bitButton>
        <i aria-hidden="true" class="bwi bwi-lg bwi-eye"></i>
      </button>
      <button bitSuffix bitButton>
        <i aria-hidden="true" class="bwi bwi-lg bwi-clone"></i>
      </button>
    </bit-form-field>
  `,
});

export const ButtonInputGroup = ButtonGroupTemplate.bind({});
ButtonInputGroup.args = {};

const SelectTemplate: Story<BitFormFieldComponent> = (args: BitFormFieldComponent) => ({
  props: args,
  template: `
    <bit-form-field>
      <bit-label>Label</bit-label>
      <select bitInput>
        <option>Select</option>
        <option>Other</option>
      </select>
    </bit-form-field>
  `,
});

export const Select = SelectTemplate.bind({});
Select.args = {};

const TextareaTemplate: Story<BitFormFieldComponent> = (args: BitFormFieldComponent) => ({
  props: args,
  template: `
    <bit-form-field>
      <bit-label>Textarea</bit-label>
      <textarea bitInput rows="4"></textarea>
    </bit-form-field>
  `,
});

export const Textarea = TextareaTemplate.bind({});
Textarea.args = {};
