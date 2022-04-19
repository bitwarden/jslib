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
              premium: "Premium",
              informative: "Informative",
              warning: "Warning",
              error: "Error",
            });
          },
        },
      ],
    }),
  ],
  args: {
    bannerType: "warning",
  },
} as Meta;

const Template: Story<BannerComponent> = (args: BannerComponent) => ({
  props: args,
  template: `
    <bit-banner [bannerType]="bannerType" [bannerTitle]="title">Content Really Long Text Lorem Ipsum Ipsum Ipsum</bit-banner>
  `,
});

export const Premium = Template.bind({});
Premium.args = {
  bannerType: "premium",
};

export const Info = Template.bind({});
Info.args = {
  bannerType: "info",
};

export const Warning = Template.bind({});
Warning.args = {
  bannerType: "warning",
};

export const Danger = Template.bind({});
Danger.args = {
  bannerType: "danger",
};
