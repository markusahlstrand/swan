import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log("Swan VS Code Extension is now active!");

  // Hello World Command
  const helloWorldCommand = vscode.commands.registerCommand(
    "swan.helloWorld",
    () => {
      vscode.window.showInformationMessage("Hello World from Swan!");
    }
  );

  // Open Documentation Command
  const openDocsCommand = vscode.commands.registerCommand(
    "swan.openDocs",
    () => {
      vscode.env.openExternal(
        vscode.Uri.parse("https://your-swan-docs-url.com")
      );
    }
  );

  // Create Project Command
  const createProjectCommand = vscode.commands.registerCommand(
    "swan.createProject",
    async () => {
      const projectName = await vscode.window.showInputBox({
        prompt: "Enter project name",
        placeHolder: "my-swan-project",
      });

      if (projectName) {
        const terminal = vscode.window.createTerminal("Swan Project Setup");
        terminal.sendText(`pnpm create swan-app ${projectName}`);
        terminal.show();

        vscode.window.showInformationMessage(
          `Creating Swan project: ${projectName}`
        );
      }
    }
  );

  // Status Bar Item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = "$(rocket) Swan";
  statusBarItem.tooltip = "Swan Development Tools";
  statusBarItem.command = "swan.helloWorld";
  statusBarItem.show();

  // Register all commands
  context.subscriptions.push(
    helloWorldCommand,
    openDocsCommand,
    createProjectCommand,
    statusBarItem
  );

  // Configuration change listener
  vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("swan")) {
      const config = vscode.workspace.getConfiguration("swan");
      const logLevel = config.get("logLevel");
      console.log(`Swan log level changed to: ${logLevel}`);
    }
  });

  // Show welcome message on first activation
  const hasShownWelcome = context.globalState.get(
    "swan.hasShownWelcome",
    false
  );
  if (!hasShownWelcome) {
    vscode.window
      .showInformationMessage(
        "Welcome to Swan VS Code Extension! 🦢",
        "Open Docs",
        "Create Project"
      )
      .then((selection) => {
        if (selection === "Open Docs") {
          vscode.commands.executeCommand("swan.openDocs");
        } else if (selection === "Create Project") {
          vscode.commands.executeCommand("swan.createProject");
        }
      });

    context.globalState.update("swan.hasShownWelcome", true);
  }
}

export function deactivate() {
  console.log("Swan VS Code Extension is now deactivated");
}
