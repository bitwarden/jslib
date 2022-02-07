import { Story, Meta } from "@storybook/angular";
import { BadgeComponent } from "./badge.component";

export default {
  title: "Jslib/Badge",
  component: BadgeComponent,
  args: {
    mode: "primary",
    buttonType: "default",
  },
} as Meta;

const Template: Story<BadgeComponent> = (args: BadgeComponent) => ({
  props: args,
  template: `
    <bit-badge>Content</bit-badge>
  `,
});

export const Primary = Template.bind({});
Primary.args = {};
