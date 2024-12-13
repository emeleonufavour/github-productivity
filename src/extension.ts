// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let activeCodingTime = 0
let isUserActive = false;
let interval: NodeJS.Timer

// Path to the log file
const logFilePath = path.join(__dirname, 'coding-time-log.txt');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "github-productivity" is now active!');

	vscode.window.onDidChangeTextEditorSelection(onUserActivity, null, context.subscriptions);
	vscode.workspace.onDidChangeTextDocument(onUserActivity, null, context.subscriptions);

	// Start interval to check and write coding time every minute
	interval = setInterval(() => {
		if (isUserActive) {
		  activeCodingTime += 60; // Increment by 60 seconds (1 minute)
	
		  if (activeCodingTime >= 30 * 60) {
			writeToFile();
			activeCodingTime = 0; // Reset after writing
		  }
		}
	  }, 60 * 1000);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('github-productivity.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Github productivity!');
	});

	context.subscriptions.push(disposable);
}

/**
 * Detect user activity
 */
function onUserActivity() {
	isUserActive = true;
  }

/**
 * Write the accumulated coding time to a file
 */
function writeToFile() {
	const message = `User has spent 30 minutes coding as of ${new Date().toISOString()}\n`;
  
	// Check if the file exists
	if (!fs.existsSync(logFilePath)) {
	  // Create the file if it doesn't exist
	  fs.writeFileSync(logFilePath, message, { flag: 'w' }); // 'w' ensures the file is created
	  vscode.window.showInformationMessage('Your log file has been created!');
	  console.log('Your log file has been created!');
	} else {
	  // Append to the file if it exists
	  fs.appendFileSync(logFilePath, message); // Append without overwriting
	  console.log('Message appended to existing log file.');
	}
  }

// This method is called when your extension is deactivated
export function deactivate() {
	
}
