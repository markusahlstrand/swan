# API Reference

Welcome to the Swan API documentation. Here you'll find detailed information about all available methods, classes, and utilities.

## Core APIs

### Configuration

Swan provides a flexible configuration system that allows you to customize behavior across all tools.

```typescript
import { configure } from "swan";

configure({
  theme: "dark",
  language: "en",
  debug: false,
});
```

### Utilities

#### `createApp(options)`

Creates a new Swan application instance.

**Parameters:**

- `options` (Object) - Configuration options
  - `name` (string) - Application name
  - `version` (string) - Application version
  - `plugins` (Array) - List of plugins to load

**Returns:**

- `App` - Application instance

**Example:**

```typescript
import { createApp } from "swan";

const app = createApp({
  name: "My App",
  version: "1.0.0",
  plugins: ["router", "state"],
});
```

#### `logger`

Built-in logging utility with multiple levels.

**Methods:**

- `logger.info(message)` - Info level logging
- `logger.warn(message)` - Warning level logging
- `logger.error(message)` - Error level logging
- `logger.debug(message)` - Debug level logging

**Example:**

```typescript
import { logger } from "swan";

logger.info("Application started");
logger.error("Something went wrong");
```

## Extension APIs

### VS Code Integration

Swan provides seamless integration with Visual Studio Code through its extension API.

#### `registerCommand(name, handler)`

Registers a new VS Code command.

**Parameters:**

- `name` (string) - Command identifier
- `handler` (Function) - Command handler function

**Example:**

```typescript
import { registerCommand } from "swan/vscode";

registerCommand("swan.helloWorld", () => {
  console.log("Hello from Swan!");
});
```

## Types

### `AppConfig`

```typescript
interface AppConfig {
  name: string;
  version: string;
  plugins?: string[];
  theme?: "light" | "dark";
  debug?: boolean;
}
```

### `Logger`

```typescript
interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}
```

## Examples

Check out these practical examples:

- **Basic App Setup** - Simple Swan application setup
- **Plugin Development** - Creating custom Swan plugins
- **VS Code Extension** - Integrating with the Swan VS Code extension
