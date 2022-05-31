import { CommonModule } from "@angular/common";
import { RouterTestingModule } from "@angular/router/testing";
import { Meta, moduleMetadata, Story } from "@storybook/angular";

import { BlankComponent } from "./blank.component";
import { TabGroupComponent } from "./tab-group.component";
import { TabItemComponent } from "./tab-item.component";

export default {
  title: "Jslib/Tabs",
  component: TabGroupComponent,
  decorators: [
    moduleMetadata({
      declarations: [TabGroupComponent, TabItemComponent, BlankComponent],
      imports: [
        CommonModule,
        RouterTestingModule.withRoutes([
          { path: "active", component: BlankComponent },
          { path: "item/2", component: BlankComponent },
          { path: "item/3", component: BlankComponent },
          { path: "disabled", component: BlankComponent },
        ]),
      ],
    }),
  ],
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/Zt3YSeb6E6lebAffrNLa0h/branch/f32LSg3jaegICkMu7rPARm/Web-Vault-Components-(Bootstrap)?node-id=1881%3A18454",
    },
  },
} as Meta;

const TabGroupTemplate: Story<TabGroupComponent> = (args: TabGroupComponent) => ({
  props: args,
  template: `
    <bit-tab-group>
      <bit-tab-item [route]="['active']">Active</bit-tab-item>
      <bit-tab-item [route]="['item/2']">Item 2</bit-tab-item>
      <bit-tab-item [route]="['item/3']">Item 3</bit-tab-item>
      <bit-tab-item [route]="['disabled']" [disabled]="true">Disabled</bit-tab-item>
    </bit-tab-group>
    <router-outlet></router-outlet>
  `,
});

export const TabGroup = TabGroupTemplate.bind({});
