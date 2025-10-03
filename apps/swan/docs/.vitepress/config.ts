import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Swan",
  description: "Swan Documentation",
  base: "/",

  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Guide", link: "/guide/" },
      { text: "API", link: "/api/" },
    ],

    sidebar: [
      {
        text: "Getting Started",
        items: [
          { text: "Introduction", link: "/guide/introduction" },
          { text: "Installation", link: "/guide/installation" },
        ],
      },
      {
        text: "API Reference",
        items: [{ text: "Overview", link: "/api/" }],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/your-username/swan" },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2025 Swan Project",
    },
  },
});
