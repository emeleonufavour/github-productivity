// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';


let extensionName = 'Github-Productivity';
let activityTimer: NodeJS.Timeout | undefined;
let remainingTime = 30 * 60 * 1000; // 30 minutes in milliseconds
let lastActivityTimestamp: number | undefined;

/**
 * Checks if Git is initialized in the current project folder.
 * @param workspacePath The path to the current workspace folder.
 * @returns True if Git is initialized, otherwise false.
 */
function isGitInitialized(workspacePath: string): boolean {
	const gitFolderPath = path.join(workspacePath, '.git');
	return fs.existsSync(gitFolderPath) && fs.statSync(gitFolderPath).isDirectory();
  }

/**
 * Executes a Git command in the workspace directory.
 * @param command The Git command to execute.
 * @param workspacePath The path to the workspace folder.
 * @returns A promise that resolves when the command is complete.
 */
function executeGitCommand(command: string, workspacePath: string): Promise<void> {
	return new Promise((resolve, reject) => {
	  exec(command, { cwd: workspacePath }, (error, stdout, stderr) => {
		if (error) {
		  console.error(`Error executing command: ${command}`, stderr);
		  reject(error);
		} else {
		  console.log(`Command executed: ${command}`, stdout);
		  resolve();
		}
	  });
	});
  }

/**
 * Adds and commits the log file to the Git repository.
 * @param logFilePath The path to the log file.
 * @param workspacePath The path to the workspace folder.
 */
async function commitLogFile(logFilePath: string, workspacePath: string) {
	if (isGitInitialized(workspacePath)) {
	  try {
		// Stage the file
		await executeGitCommand(`git add ${logFilePath}`, workspacePath);
  
		// Commit the file with a message
		await executeGitCommand(
		  `git commit -m "Log 30 minutes of coding activity"`,
		  workspacePath
		);
  
		vscode.window.showInformationMessage("Log file committed to Git successfully.");
	  } catch (error) {
		vscode.window.showErrorMessage("Failed to commit log file to Git.");
	  }
	} else {
	  vscode.window.showWarningMessage("Git is not initialized. Log file was not committed.");
	}
  }

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Do not run extension if no workspace is opened
	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
		vscode.window.showWarningMessage(
		  `No workspace folder is open. ${extensionName} will not run.`
		);
		return; 
	  }

	const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
  	const logFilePath = path.join(workspacePath, `${extensionName}-log.txt`);

  	vscode.window.showInformationMessage(`${extensionName} is now active!`);

  	const startOrResumeTimer = () => {
		// If a timer already exists, clear it
		if (activityTimer) {
		  clearTimeout(activityTimer);
		}
	
		// Start a new timer for the remaining time
		activityTimer = setTimeout(async () => {
		  const message = `You spent 30 minutes coding as of ${new Date().toISOString()}\n`;
	
		  if (!fs.existsSync(logFilePath)) {
			fs.writeFileSync(logFilePath, message, { flag: 'w' });
			vscode.window.showInformationMessage(`Your log file has been created!`);
			console.log('Log file created and initial message written.');
		  } else {
			fs.appendFileSync(logFilePath, message);
			console.log('Message added to existing log file.');
		  }

		  // Commit the log file to Git
		  await commitLogFile(logFilePath, workspacePath);
	
		  // Reset the remaining time for the next 30-minute period
		  remainingTime = 30 * 60 * 1000;
		  startOrResumeTimer();
		}, remainingTime);
	
		// Record the start time of this period
		lastActivityTimestamp = Date.now();
	  };
	
	  const pauseTimer = () => {
		if (activityTimer) {
		  clearTimeout(activityTimer);
		  activityTimer = undefined;
		}
	
		// Update remaining time based on elapsed time since the last activity
		if (lastActivityTimestamp) {
		  const elapsedTime = Date.now() - lastActivityTimestamp;
		  remainingTime = Math.max(remainingTime - elapsedTime, 0);
		}
	  };
	
	  const handleActivity = () => {
		pauseTimer();
		startOrResumeTimer();
	  };
	
	
	  const selectionChangeDisposable = vscode.window.onDidChangeTextEditorSelection(() => {
		handleActivity();
	  });
	
	  // This will listen for changes to the document
	  const documentChangeDisposable = vscode.workspace.onDidChangeTextDocument(() => {
		handleActivity();
	  });
	
	  context.subscriptions.push(selectionChangeDisposable, documentChangeDisposable);
	
	  // Cleanup resources on deactivation
	  context.subscriptions.push({
		dispose: () => {
		  pauseTimer();
		},
	  });
}

// This method is called when your extension is deactivated
export function deactivate() {
	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
		return;
	  }
	
	  const logFilePath = path.join(
		vscode.workspace.workspaceFolders[0].uri.fsPath,
		'coding-time-log.txt'
	  );
	
	  if (fs.existsSync(logFilePath)) {
		try {
		  fs.unlinkSync(logFilePath);
		  console.log('Log file deleted successfully.');
		} catch (error) {
		  console.error('Error deleting log file:', error);
		}
	  }
}
