import { Meta, Story } from "@storybook/angular";

import { BadgeDirective } from "./badge.directive";

export default {
  title: "Jslib/Badge",
  component: BadgeDirective,
  args: {
    badgeType: "primary",
  },
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/f32LSg3jaegICkMu7rPARm/Tailwind-Component-Library-Update?node-id=1881%3A16956",
    },
  },
} as Meta;

const Template: Story<BadgeDirective> = (args: BadgeDirective) => ({
  props: args,
  template: `
    <span class="tw-text-main">Span </span><span bitBadge [badgeType]="badgeType">Badge</span>
    <br><br>
    <span class="tw-text-main">Link </span><a href="#" bitBadge [badgeType]="badgeType">Badge</a>
    <br><br>
    <span class="tw-text-main">Button </span><button bitBadge [badgeType]="badgeType">Badge</button>
  `,
});

export const Primary = Template.bind({});
Primary.args = {};

export const Secondary = Template.bind({});
Secondary.args = {
  badgeType: "secondary",
};

export const Success = Template.bind({});
Success.args = {
  badgeType: "success",
};

export const Danger = Template.bind({});
Danger.args = {
  badgeType: "danger",
};

export const Warning = Template.bind({});
Warning.args = {
  badgeType: "warning",
};

export const Info = Template.bind({});
Info.args = {
  badgeType: "info",
};
