import { Meta, Story } from "@storybook/angular";

import { ButtonDirective } from "./button.directive";

export default {
  title: "Jslib/Button",
  component: ButtonDirective,
  args: {
    buttonType: "primary",
  },
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/f32LSg3jaegICkMu7rPARm/Tailwind-Component-Library-Update?node-id=1881%3A16733",
    },
  },
} as Meta;

const Template: Story<ButtonDirective> = (args: ButtonDirective) => ({
  props: args,
  template: `
    <button bitButton [buttonType]="buttonType" [block]="block">Button</button>
    <a bitButton [buttonType]="buttonType" [block]="block" href="#" class="tw-ml-2">Link</a>
  `,
});

export const Primary = Template.bind({});
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
    <button bitButton disabled buttonType="primary" class="tw-mr-2">Primary</button>
    <button bitButton disabled buttonType="secondary" class="tw-mr-2">Secondary</button>
    <button bitButton disabled buttonType="danger" class="tw-mr-2">Danger</button>
  `,
});

export const Disabled = DisabledTemplate.bind({});
Disabled.args = {
  size: "small",
};
