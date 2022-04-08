import { Meta, moduleMetadata, Story } from "@storybook/angular";

import { I18nService } from "jslib-common/abstractions/i18n.service";

import { I18nMockService } from "../utils/i18n-mock.service";

import { BannerComponent } from "./banner.component";

export default {
  title: "Jslib/Banner",
  component: BannerComponent,
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: I18nService,
          useFactory: () => {
            return new I18nMockService({
              warning: "Warning",
              error: "Error",
            });
          },
        },
      ],
    }),
  ],
  args: {
    type: "warning",
  },
} as Meta;

const Template: Story<BannerComponent> = (args: BannerComponent) => ({
  props: args,
  template: `
    <bit-banner [type]="type" [title]="title">Content Really Long Text Lorem Ipsum Ipsum Ipsum</bit-banner>
  `,
});

export const Premium = Template.bind({});
Premium.args = {
  type: "premium",
  title: "Premium",
};

export const Info = Template.bind({});
Info.args = {
  type: "info",
  title: "Informative",
};

export const Warning = Template.bind({});
Warning.args = {
  type: "warning",
};

export const Danger = Template.bind({});
Danger.args = {
  type: "danger",
};
