import { Meta, Story } from "@storybook/angular";

import { ButtonComponent } from "./button.component";

// More on default export: https://storybook.js.org/docs/angular/writing-stories/introduction#default-export
export default {
  title: "Jslib/Button",
  component: ButtonComponent,
  args: {
    buttonType: "primary",
  },
  // More on argTypes: https://storybook.js.org/docs/angular/api/argtypes
} as Meta;

// More on component templates: https://storybook.js.org/docs/angular/writing-stories/introduction#using-args
const Template: Story<ButtonComponent> = (args: ButtonComponent) => ({
  props: args,
  template: `
    <button bit-button [buttonType]="buttonType" [block]="block">Button</button>
    <a bit-button [buttonType]="buttonType" [block]="block" href="#" class="tw-ml-2">Link</a>
  `,
});

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/angular/writing-stories/args
Primary.args = {
  buttonType: "primary",
};

export const Secondary = Template.bind({});
Secondary.args = {
  buttonType: "secondary",
};

export const Danger = Template.bind({});
Danger.args = {
  buttonType: "danger",
};

const DisabledTemplate: Story = (args) => ({
  props: args,
  template: `
    <button bit-button disabled buttonType="primary" class="tw-mr-2">Primary</button>
    <button bit-button disabled buttonType="secondary" class="tw-mr-2">Secondary</button>
    <button bit-button disabled buttonType="danger" class="tw-mr-2">Danger</button>
  `,
});

export const Disabled = DisabledTemplate.bind({});
Disabled.args = {
  size: "small",
};
