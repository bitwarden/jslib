import { setCompodocJson } from "@storybook/addon-docs/angular";
import docJson from "../documentation.json";
setCompodocJson(docJson);

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  docs: { inlineStories: true },
  themes: {
    default: "light",
    list: [
      { name: "light", class: "theme_light", color: "#ffffff" },
      { name: "dark", class: "theme_dark", color: "#1f242e" },
    ],
  },
};
