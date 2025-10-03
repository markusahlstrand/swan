import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Swan",
  description: "Modern Service Architecture Made Simple",
  base: "/",

  head: [
    ["meta", { name: "theme-color", content: "#3eaf7c" }],
    ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
    [
      "meta",
      { name: "apple-mobile-web-app-status-bar-style", content: "black" },
    ],
  ],

  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Architecture", link: "/architecture/" },
      { text: "Stacks", link: "/stacks/" },
      { text: "Deployment", link: "/deployment/" },
      { text: "Templates", link: "/templates/" },
      { text: "API", link: "/api/" },
      { text: "AI Reference", link: "/swan" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Getting Started",
          collapsed: false,
          items: [
            { text: "Quick Start", link: "/guide/getting-started" },
            { text: "Introduction", link: "/guide/introduction" },
            { text: "Installation", link: "/guide/installation" },
          ],
        },
      ],

      "/architecture/": [
        {
          text: "Service Architecture",
          collapsed: false,
          items: [
            { text: "Overview", link: "/architecture/" },
            { text: "API Versioning", link: "/architecture/versioning" },
            { text: "Authentication", link: "/architecture/auth" },
            { text: "OpenAPI Integration", link: "/architecture/openapi" },
            { text: "Monitoring", link: "/architecture/monitoring" },
          ],
        },
      ],

      "/stacks/": [
        {
          text: "Technology Stacks",
          collapsed: false,
          items: [
            { text: "Overview", link: "/stacks/" },
            { text: "Node.js", link: "/stacks/nodejs" },
            { text: "Python", link: "/stacks/python" },
            { text: "Rust", link: "/stacks/rust" },
            { text: "Go", link: "/stacks/golang" },
            { text: ".NET", link: "/stacks/dotnet" },
          ],
        },
      ],

      "/deployment/": [
        {
          text: "Deployment Targets",
          collapsed: false,
          items: [
            { text: "Overview", link: "/deployment/" },
            { text: "Cloudflare Workers", link: "/deployment/cloudflare" },
            { text: "Docker", link: "/deployment/docker" },
            { text: "Vercel", link: "/deployment/vercel" },
            { text: "AWS Lambda", link: "/deployment/aws-lambda" },
            { text: "Google Cloud Run", link: "/deployment/gcp-run" },
            { text: "Heroku", link: "/deployment/heroku" },
            { text: "Railway", link: "/deployment/railway" },
            { text: "Fly.io", link: "/deployment/fly" },
          ],
        },
      ],

      "/templates/": [
        {
          text: "Templates",
          collapsed: false,
          items: [
            { text: "Template Library", link: "/templates/" },
            { text: "RESTful API", link: "/templates/restful-api" },
            { text: "GraphQL API", link: "/templates/graphql" },
            { text: "Authentication Service", link: "/templates/auth-service" },
            { text: "File Storage", link: "/templates/file-storage" },
            { text: "Analytics API", link: "/templates/analytics" },
          ],
        },
      ],

      "/api/": [
        {
          text: "API Reference",
          collapsed: false,
          items: [
            { text: "Overview", link: "/api/" },
            { text: "CLI Commands", link: "/api/cli" },
            { text: "Configuration", link: "/api/configuration" },
            { text: "Schemas", link: "/api/schemas" },
          ],
        },
      ],

      // Default sidebar for other pages
      "/": [
        {
          text: "Getting Started",
          collapsed: false,
          items: [
            { text: "Quick Start", link: "/guide/getting-started" },
            { text: "Introduction", link: "/guide/introduction" },
            { text: "Installation", link: "/guide/installation" },
          ],
        },
        {
          text: "Core Concepts",
          collapsed: false,
          items: [
            { text: "Architecture", link: "/architecture/" },
            { text: "Technology Stacks", link: "/stacks/" },
            { text: "Deployment", link: "/deployment/" },
            { text: "Templates", link: "/templates/" },
          ],
        },
        {
          text: "Reference",
          collapsed: false,
          items: [
            { text: "API Documentation", link: "/api/" },
            { text: "AI Reference", link: "/swan" },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/markusahlstrand/swan" },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2025 Swan Framework",
    },

    editLink: {
      pattern:
        "https://github.com/markusahlstrand/swan/edit/main/apps/swan/docs/:path",
      text: "Edit this page on GitHub",
    },

    search: {
      provider: "local",
    },

    outline: {
      level: [2, 3],
    },
  },

  markdown: {
    theme: {
      light: "github-light",
      dark: "github-dark",
    },
    lineNumbers: true,
  },
});
