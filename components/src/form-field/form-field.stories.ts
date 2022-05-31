import { CommonModule } from "@angular/common";
import { Meta, Story, moduleMetadata } from "@storybook/angular";
import { BitInput } from "src/input/input.component";

import { FormFieldComponent } from "./form-field.component";
import { BitLabel } from "./label";

export default {
  title: "Jslib/FormField",
  component: FormFieldComponent,
  decorators: [
    moduleMetadata({
      declarations: [FormFieldComponent, BitInput, BitLabel],
      imports: [CommonModule],
    }),
  ],
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/f32LSg3jaegICkMu7rPARm/Tailwind-Component-Library-Update?node-id=1717%3A14394",
    },
  },
} as Meta;

const TextTemplate: Story<FormFieldComponent> = (args: FormFieldComponent) => ({
  props: args,
  template: `
    <bit-form-field>
      <bit-label>email</bit-label>
      <input bit-input type="text" [disabled]="disabled" [required]="required"/>
    </bit-form-field>
  `,
});

export const Text = TextTemplate.bind({});
Text.args = {
  disabled: false,
  required: true,
};
