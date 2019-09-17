import * as vscode from "vscode";
import parser from "./parser";

const convert = (editor: vscode.TextEditor) => {
  let selectedText = editor.document.getText(editor.selection);
  let tabSize = editor.options.tabSize;
  let withSpaces = editor.options.insertSpaces;

  if (selectedText.length === 0) {
    vscode.window.showWarningMessage(
      "No selection has been made. Select some HTML text and try again."
    );
    return;
  }
  parser.setIndent({
    style: withSpaces ? " " : "\t",
    size: withSpaces ? Number(tabSize) : 1
  });
  editor
    .edit((editBuilder: vscode.TextEditorEdit) => {
      editBuilder.replace(editor.selection, parser.convert(selectedText));
    });
};

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "extension.html2seed",
    () => {
      let editor = vscode.window.activeTextEditor;
      if (editor) {
        convert(editor);
      }
    }
  );

  context.subscriptions.push(disposable);
}
