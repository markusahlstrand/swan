## 🦢 Swan (Service web api notation)

**Swan** is a comprehensive, open-source toolset dedicated to defining, documenting, and enhancing the developer experience for **Service web api notation**.

It provides a standardized, human-readable format for describing your web services and integrates seamlessly with AI and VS Code to accelerate the development lifecycle.

### ✨ Key Features

- **AI-Powered Spec Generation:** Use natural language prompts to instantly generate detailed Swan notation specifications directly within VS Code.
- **Markdown Compatibility:** Specs are written in standard Markdown files (`.md`) for maximum editor compatibility and rendering.
- **Integrated Tooling:** Seamless experience with a dedicated VS Code extension for syntax highlighting, validation, and powerful actions.
- **Code Implementation:** Request the VS Code plugin to scaffold and implement your service based on the Swan spec, specifying tech stacks and deployment targets.
- **Documentation Hub:** The definitive source for the Swan notation specification, guides, and tooling.

### 🚀 Quick Start

```bash
# Development
pnpm vitepress dev     # Start docs site (localhost:5173)
pnpm vscode dev        # Watch VS Code extension
pnpm dev               # Start everything

# Building
pnpm vitepress build   # Build docs for production
pnpm vscode package    # Package VS Code extension
pnpm build             # Build everything
```

---

### 🚀 Quick Start: End-User Workflow

The primary way to use Swan is through our powerful **VS Code Extension**, which uses AI to guide you from a simple concept to a deployed service.

#### 1. Generate the Swan Specification

Start by using the VS Code extension's prompt interface (or an LLM) to describe your service in natural language and ask it to generate the Swan spec.

**Prompt Example:**

> "Create a spec for a simple microservice that handles user authentication, including sign-up, login, and password reset endpoints. Use the Swan notation as defined in **`swan.ahlstrand.es/swan.md`**."

#### 2. Review and Refine the Spec

The generated Swan spec will now appear in your workspace as a **Markdown file** (e.g., `auth.md`). This step is crucial to ensure the notation correctly and precisely describes your project's requirements, data models, and API contracts.

**Action:** _Review the generated **Markdown file**. Make any necessary adjustments to finalize your service contract._

#### 3. Implement the Service

Once the spec is finalized, you can leverage the VS Code plugin to scaffold the actual service implementation.

**Implementation Request Example:**

> "Implement this service using **Node.js/Express** with a **MongoDB** database, and configure it for deployment to **AWS Lambda**."

The extension will scaffold the project structure, boilerplate code, and configuration files based on your finalized spec and desired stack.

---

### 🌐 Live Links

| Resource                     | Link                                                    |
| :--------------------------- | :------------------------------------------------------ |
| **Official Notation & Docs** | [swan.ahlstrand.es/swan.md](YOUR-VITEPRESS-SITE-URL)    |
| **VS Code Marketplace**      | [View the Swan extension](YOUR-VS-CODE-MARKETPLACE-URL) |

---

### ⚙️ Development Setup (For Contributors)

This project is organized as a monorepo managed by **pnpm**. Below are the instructions for setting up your local environment to contribute to the tooling or documentation.

#### Monorepo Structure

```

swan/
├── apps/
│   └── swan/               \# VitePress documentation site
├── packages/
│   └── vscode-plugin/      \# VS Code extension
├── package.json            \# Root package.json
└── pnpm-workspace.yaml     \# pnpm workspace configuration

```

#### Prerequisites

- **Node.js v18** or higher
- **pnpm v8** or higher
- **Git**

#### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd swan
    ```
2.  **Install dependencies**
    ```bash
    pnpm install
    ```

#### Development Commands

Use the root level scripts or the project-specific filter commands to manage the workspace.

| Command           | Description                                                              |
| :---------------- | :----------------------------------------------------------------------- |
| `pnpm dev`        | **Starts all projects** in development mode (VitePress & VS Code watch). |
| `pnpm build`      | Builds all production-ready packages and the documentation site.         |
| `pnpm clean`      | Cleans all build artifacts (`dist/` folders).                            |
| `pnpm lint`       | Lints all packages.                                                      |
| `pnpm type-check` | Runs TypeScript type checking across the monorepo.                       |

#### Convenient Shortcuts

**VitePress Documentation Site:**
| Command | Description |
| :----------------------- | :------------------------------------------------------------- |
| `pnpm vitepress dev` | Start VitePress development server (`http://localhost:5173`) |
| `pnpm vitepress build` | Build VitePress site for production |
| `pnpm vitepress preview` | Preview production build locally |
| `pnpm docs dev` | Alias for `pnpm vitepress dev` |
| `pnpm docs build` | Alias for `pnpm vitepress build` |

**VS Code Extension:**
| Command | Description |
| :------------------------ | :--------------------------------------------- |
| `pnpm vscode dev` | Watch VS Code extension for changes |
| `pnpm vscode compile` | Compile TypeScript to JavaScript |
| `pnpm vscode watch` | Watch and recompile on changes |
| `pnpm vscode package` | Create `.vsix` package for installation |
| `pnpm vscode test` | Run extension tests |
| `pnpm extension dev` | Alias for `pnpm vscode dev` |
| `pnpm extension compile` | Alias for `pnpm vscode compile` |

#### Legacy Filter Commands

| Command                             | Description                                                                |
| :---------------------------------- | :------------------------------------------------------------------------- |
| `pnpm --filter swan dev`            | Start development server for the VitePress site (`http://localhost:5173`). |
| `pnpm --filter vscode-plugin watch` | Watch for changes in the VS Code extension source code.                    |

#### Building and Publishing

##### Documentation Site (`apps/swan`)

To build for production:

```bash
pnpm --filter swan build
```

The built site will be in `apps/swan/docs/.vitepress/dist/`. Deploy this directory to your hosting provider (GitHub Pages, Vercel, Netlify, etc.).

##### VS Code Extension (`packages/vscode-plugin`)

To create the installable package:

```bash
pnpm --filter vscode-plugin package
```

This creates a `.vsix` file. To publish to the VS Code Marketplace, use the following (ensure you have the necessary credentials):

```bash
pnpm --filter vscode-plugin vsce publish
```

---

### 🤝 Contributing

We welcome all contributions\!

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'feat: Add some amazing feature'`).
5.  Push to the branch (`git push origin feature/amazing-feature`).
6.  Open a **Pull Request**.

### Troubleshooting

- **Dependencies not installing:** Run `rm -rf node_modules` and then `pnpm install` to clean and rebuild the workspace.
- **VS Code extension not working:** Ensure TypeScript is compiled: `pnpm --filter vscode-plugin compile`. Check the VS Code Developer Console for detailed errors.

### License

Distributed under the **MIT License**. See the `LICENSE` file for details.
