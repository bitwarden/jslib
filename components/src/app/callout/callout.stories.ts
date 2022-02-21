import { Story, Meta, moduleMetadata } from "@storybook/angular";
import { AppModule } from "../app.module";
import { CalloutComponent } from "./callout.component";

export default {
  title: "Jslib/Callout",
  component: CalloutComponent,
  decorators: [
    moduleMetadata({
      imports: [AppModule],
    }),
  ],
  args: {
    type: "warning",
  },
} as Meta;

const Template: Story<CalloutComponent> = (args: CalloutComponent) => ({
  props: args,
  template: `
    <bit-callout [type]="type">Content</bit-callout>
  `,
});

export const Primary = Template.bind({});
Primary.args = {};

export const Success = Template.bind({});
Success.args = {
  type: "success",
};

export const Danger = Template.bind({});
Danger.args = {
  type: "danger",
};

export const Warning = Template.bind({});
Warning.args = {
  type: "warning",
};

export const Info = Template.bind({});
Info.args = {
  type: "info",
};
