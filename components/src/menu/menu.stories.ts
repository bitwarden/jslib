import { OverlayModule } from "@angular/cdk/overlay";
import { Meta, moduleMetadata, Story } from "@storybook/angular";

import { ButtonModule } from "../button/button.module";

import { MenuDividerComponent } from "./menu-divider.component";
import { MenuItemDirective } from "./menu-item.directive";
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
        MenuItemDirective,
        MenuDividerComponent,
      ],
      imports: [OverlayModule, ButtonModule],
    }),
  ],
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/f32LSg3jaegICkMu7rPARm/Tailwind-Component-Library-Update?node-id=1881%3A17952",
    },
  },
} as Meta;

const Template: Story<MenuTriggerForDirective> = (args: MenuTriggerForDirective) => ({
  props: args,
  template: `
    <bit-menu #myMenu="menuComponent">
      <a href="#" bitMenuItem>Anchor link</a>
      <a href="#" bitMenuItem>Another link</a>
      <button type="button" bitMenuItem>Button</button>
      <bit-menu-divider></bit-menu-divider>
      <button type="button" bitMenuItem>Button after divider</button>
    </bit-menu>

    <div class="tw-h-40">
      <div class="cdk-overlay-pane bit-menu-panel">
        <ng-container *ngTemplateOutlet="myMenu.templateRef"></ng-container>
      </div>
    </div>
    `,
});

const TemplateWithButton: Story<MenuTriggerForDirective> = (args: MenuTriggerForDirective) => ({
  props: args,
  template: `
    <div class="tw-h-40">
      <button bitButton buttonType="secondary" [bitMenuTriggerFor]="myMenu">Open menu</button>
    </div>

    <bit-menu #myMenu>
      <a href="#" bitMenuItem>Anchor link</a>
      <a href="#" bitMenuItem>Another link</a>
      <button type="button" bitMenuItem>Button</button>
      <bit-menu-divider></bit-menu-divider>
      <button type="button" bitMenuItem>Button after divider</button>
    </bit-menu>`,
});

export const OpenMenu = Template.bind({});
export const ClosedMenu = TemplateWithButton.bind({});
