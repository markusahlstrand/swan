# Swan VS Code Extension

A powerful Visual Studio Code extension for Swan development toolkit.

## Features

- **Quick Commands**: Access Swan tools directly from the command palette
- **Project Creation**: Create new Swan projects with a single command
- **Code Snippets**: Pre-built snippets for common Swan patterns
- **Documentation Integration**: Quick access to Swan documentation
- **Status Bar Integration**: Swan tools at your fingertips

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Swan"
4. Click Install

### From Source

1. Clone the repository
2. Navigate to `packages/vscode-plugin`
3. Run `pnpm install`
4. Run `pnpm run compile`
5. Press F5 to launch a new Extension Development Host window

## Commands

| Command                         | Description                        |
| ------------------------------- | ---------------------------------- |
| `Swan: Hello World`             | Display a welcome message          |
| `Swan: Open Documentation`      | Open Swan documentation in browser |
| `Swan: Create New Swan Project` | Create a new Swan project          |

## Snippets

### JavaScript/TypeScript

- `swan-app` - Create a new Swan application
- `swan-component` - Create a new Swan component
- `swan-log` - Add Swan logger statement
- `swan-app-ts` - Create a new Swan application (TypeScript)
- `swan-component-ts` - Create a new Swan component (TypeScript)

## Configuration

| Setting                   | Default  | Description                              |
| ------------------------- | -------- | ---------------------------------------- |
| `swan.enableAutoComplete` | `true`   | Enable auto-completion for Swan projects |
| `swan.logLevel`           | `"info"` | Set the logging level                    |

## Development

### Prerequisites

- Node.js v18 or higher
- pnpm v8 or higher
- VS Code v1.80 or higher

### Building

```bash
pnpm install
pnpm run compile
```

### Testing

```bash
pnpm run test
```

### Packaging

```bash
pnpm run package
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](../../LICENSE) file for details.

## Support

- [Documentation](https://your-swan-docs-url.com)
- [Issues](https://github.com/your-username/swan/issues)
- [Discussions](https://github.com/your-username/swan/discussions)
