// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import { Component } from "@angular/core";
import { Story, Meta, moduleMetadata } from "@storybook/angular";
import { ButtonComponent } from "./button.component";

@Component({
  selector: "dummy-button",
  template: `
    <button bit-button [buttonType]="buttonType" [mode]="mode" [block]="block">123</button>
  `,
})
class DummyButton extends ButtonComponent {
  override ngOnChanges() {}
}

// More on default export: https://storybook.js.org/docs/angular/writing-stories/introduction#default-export
export default {
  title: "Jslib/Button",
  component: DummyButton,
  decorators: [
    moduleMetadata({
      declarations: [DummyButton, ButtonComponent],
    }),
  ],
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
};

export const Secondary = Template.bind({});
Secondary.args = {
  mode: "secondary",
};

export const Outline = Template.bind({});
Outline.args = {
  buttonType: "outline",
};

export const Small = Template.bind({});
Small.args = {
  size: "small",
};
