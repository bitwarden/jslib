import { OverlayModule } from "@angular/cdk/overlay";
import { Meta, moduleMetadata, Story } from "@storybook/angular";

import { MenuDividerComponent } from "./menu-divider.component";
import { MenuItemComponent } from "./menu-item.component";
import { MenuTriggerForDirective } from "./menu-trigger-for.directive";
import { MenuComponent } from "./menu.component";

export default {
  title: "Jslib/Menu",
  component: MenuTriggerForDirective,
  decorators: [
    moduleMetadata({
      declarations: [
        MenuTriggerForDirective,
        MenuComponent,
        MenuItemComponent,
        MenuDividerComponent,
      ],
      imports: [OverlayModule],
    }),
  ],
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/f32LSg3jaegICkMu7rPARm/Tailwind-Component-Library-Update?node-id=1881%3A17952"
    }
  }
} as Meta;

const Template: Story<MenuTriggerForDirective> = (args: MenuTriggerForDirective) => ({
  props: args,
  template: `
    <button [bitMenuTriggerFor]="myMenu">Test</button>

    <bit-menu #myMenu>
      <a href="#" bit-menu-item>Anchor link</a>
      <a href="#" bit-menu-item>Another link</a>
      <button type="button" bit-menu-item>Button</button>
      <bit-menu-divider></bit-menu-divider>
      <button type="button" bit-menu-item>Button after divider</button>
    </bit-menu>`,
});

export const Primary = Template.bind({});
