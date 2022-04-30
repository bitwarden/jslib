import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
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

const Template: Story<BitFormFieldComponent> = (args: BitFormFieldComponent) => ({
  props: {
    formObj: formObj,
    ...args,
  },
  template: `
    <bit-form-field>
      <bit-label>Label</bit-label>
      <input bitInput [formControl]="formObj.get('test')" placeholder="Placeholder" />
    </bit-form-field>
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
      <button bitPrefix bit-button>Button</button>
      <button bitPrefix bit-button>Button</button>
      <button bitSuffix bit-button>
        <i aria-hidden="true" class="bwi bwi-lg bwi-eye"></i>
      </button>
      <button bitSuffix bit-button>
        <i aria-hidden="true" class="bwi bwi-lg bwi-clone"></i>
      </button>
    </bit-form-field>
  `,
});

export const ButtonInputGroup = ButtonGroupTemplate.bind({});
ButtonInputGroup.args = {};
