// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import { Story, Meta } from "@storybook/angular/types-6-0";
import { ButtonComponent } from "./button.component";

// More on default export: https://storybook.js.org/docs/angular/writing-stories/introduction#default-export
export default {
  title: "Jslib/Button",
  component: ButtonComponent,
  args: {
    mode: "primary",
    buttonType: "default",
  },
  // More on argTypes: https://storybook.js.org/docs/angular/api/argtypes
} as Meta;

// More on component templates: https://storybook.js.org/docs/angular/writing-stories/introduction#using-args
const Template: Story<ButtonComponent> = (args: ButtonComponent) => ({
  props: args,
});

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/angular/writing-stories/args
Primary.args = {
  mode: "primary",
  buttonType: "default",
  label: "Button",
};

export const Secondary = Template.bind({});
Secondary.args = {
  mode: "secondary",
  label: "Button",
};

export const Outline = Template.bind({});
Outline.args = {
  buttonType: "outline",
  label: "Button",
};

export const Small = Template.bind({});
Small.args = {
  size: "small",
  label: "Button",
};
