// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const { Range, Position, TextEdit, workspace, window } = vscode;
const exec = require("child_process").exec;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "ruby-format-vscode" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  const formatRuby = vscode.commands.registerCommand(
    "extension.formatRuby",
    onFormatRuby
  );
  const eventFormatRuby = workspace.onWillSaveTextDocument(
    onWillSaveTextDocument
  );

  context.subscriptions.push(formatRuby);
  context.subscriptions.push(eventFormatRuby);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;

function onFormatRuby() {
  let editor = window.activeTextEditor;
  if (!editor) return;
  const { document } = editor;
  runRufoOnDocument(document, edit => editor.edit(edit));
}

function onWillSaveTextDocument(event) {
  const { document } = event;
  if (!document.isDirty) return;
  if (document.languageId !== "ruby") return;
  const { formatOnSave } = workspace.getConfiguration("rufo");
  if (!formatOnSave) return;

  const promise = new Promise(resolve => {
    runRufoOnDocument(document, edit => resolve([edit(TextEdit)]));
  });
  return event.waitUntil(promise);
}

function runRufoOnDocument(document, callback) {
  try {
    const documentText = document.getText();
    const child = exec("rufo", (error, stdout, stderr) => {
      if (error || stderr) console.log("ERROR", error, stderr);
      const formattedText = stdout;
      const edit = replaceDocumentWithFormatted(document, formattedText);
      callback(edit);
    });
    child.stdin.write(documentText);
    child.stdin.end();
  } catch (err) {
    if (err.message.includes("command not found")) {
      vscode.window.showErrorMessage(
        "rufo not available in path. Ensure rufo gem is installed"
      );
    } else {
      vscode.window.showErrorMessage(err.message);
    }
  }
}

function replaceDocumentWithFormatted(document, formattedText) {
  // Build a Range spanning the entire document, start to finish
  const lastLine = document.lineCount - 1;
  const lastChar = document.lineAt(lastLine).range.end;
  const range = new Range(new Position(0, 0), new Position(lastLine, lastChar));
  // Build an edit that replaces the document with the new formatted version
  return editBuilder => editBuilder.replace(range, formattedText);
}
