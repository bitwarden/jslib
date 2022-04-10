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
} as Meta;

// This is wrapped in *ngIf to create an Angular template, which scopes the #myMenu template reference variable.
// Otherwise there are duplicate template reference variables on the page and this causes undefined behaviour.
const Template: Story<MenuTriggerForDirective> = (args: MenuTriggerForDirective) => ({
  props: args,
  template: `
  <div *ngIf="true">
    <button [bitMenuTriggerFor]="myMenu">Test</button>

    <bit-menu #myMenu>
      <a href="#" bit-menu-item>Anchor link</a>
      <a href="#" bit-menu-item>Another link</a>
      <button type="button" bit-menu-item>Button</button>
      <bit-menu-divider></bit-menu-divider>
      <button type="button" bit-menu-item>Button after divider</button>
    </bit-menu>
  </div>`,
});

export const Primary = Template.bind({});
