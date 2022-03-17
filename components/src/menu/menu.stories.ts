import { OverlayModule } from '@angular/cdk/overlay';
import { Meta, moduleMetadata, Story } from "@storybook/angular";

import { MenuTriggerForDirective } from "./menu-trigger-for.directive";
import { MenuComponent } from './menu.component';

// More on default export: https://storybook.js.org/docs/angular/writing-stories/introduction#default-export
export default {
  title: "Jslib/Menu",
  component: MenuTriggerForDirective,
  decorators: [
    moduleMetadata({
      declarations: [MenuTriggerForDirective, MenuComponent],
      imports: [OverlayModule]
    })
  ]
} as Meta;

// More on component templates: https://storybook.js.org/docs/angular/writing-stories/introduction#using-args
const Template: Story<MenuTriggerForDirective> = (args: MenuTriggerForDirective) => ({
  props: args,
  template: 
  `<button [bitMenuTriggerFor]="myMenu">Test</button>

  <bit-menu #myMenu>
    <button>One</button>
    <button>Two</button>
    <button>Three</button>
  </bit-menu>`,
});

export const Primary = Template.bind({});
