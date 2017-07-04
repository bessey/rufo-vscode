// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const { Range, Position } = vscode;
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
  var formatRuby = vscode.commands.registerCommand(
    "extension.formatRuby",
    function() {
      let editor = vscode.window.activeTextEditor;
      if (!editor) return;
      try {
        const documentText = editor.document.getText();
        const child = exec("rufo", (error, stdout, stderr) => {
          if (error || stderr) console.log("ERROR", error, stderr);
          const formattedText = stdout;
          replaceDocumentWithFormatted(editor, formattedText);
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
  );

  context.subscriptions.push(formatRuby);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;

function replaceDocumentWithFormatted(editor, formattedText) {
  // Build a Range spanning the entire document, start to finish
  const lastLine = editor.document.lineCount - 1;
  const lastChar = editor.document.lineAt(lastLine).range.end;
  const range = new Range(new Position(0, 0), new Position(lastLine, lastChar));
  // Build an edit that replaces the document with the new formatted version
  const editCb = editBuilder => editBuilder.replace(range, formattedText);

  return editor.edit(editCb);
}
