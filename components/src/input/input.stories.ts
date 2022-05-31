import { Meta, Story } from "@storybook/angular";

import { BitInput } from "./input.component";

export default {
  title: "Jslib/Input",
  component: BitInput,
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/f32LSg3jaegICkMu7rPARm/Tailwind-Component-Library-Update?node-id=1717%3A14394",
    },
  },
} as Meta;

const TextTemplate: Story<BitInput> = (args: BitInput) => ({
  props: args,
  template: `
    <input bit-input [type]="type" [required]="required" [disabled]="disabled"/>
  `,
});

const TextAreaTemplate: Story<BitInput> = (args: BitInput) => ({
  props: args,
  template: `
    <textarea bit-input [required]="required" [disabled]="disabled"></textarea>
  `,
});

export const Text = TextTemplate.bind({});
Text.args = {
  type: "text",
};

export const TextArea = TextAreaTemplate.bind({});
TextArea.args = {};
