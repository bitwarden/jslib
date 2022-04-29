import { Meta, moduleMetadata, Story } from "@storybook/angular";
import { InputModule } from "src/input/input.module";

import { FormFieldComponent } from "./form-field.component";
import { FormFieldModule } from "./form-field.module";

export default {
  title: "Jslib/Form Field",
  component: FormFieldComponent,
  decorators: [
    moduleMetadata({
      imports: [FormFieldModule, InputModule],
    }),
  ],
} as Meta;

const Template: Story<FormFieldComponent> = (args: FormFieldComponent) => ({
  props: args,
  template: `
    <bit-form-field>
      <bit-label>Label</bit-label>
      <input bitInput />
    </bit-form-field>
  `,
});

export const Default = Template.bind({});
Default.args = {
  bannerType: "premium",
};
