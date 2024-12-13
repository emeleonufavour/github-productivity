// Import required modules
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

let activityTimers: { [workspacePath: string]: NodeJS.Timeout | undefined } = {};
let remainingTimes: { [workspacePath: string]: number } = {};
let lastActivityTimestamps: { [workspacePath: string]: number | undefined } = {};
let extensionName = "scribe";

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
				vscode.window.showErrorMessage(`Error executing command: ${command}`);
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
            const commitMessage = `Log coding activity at ${new Date().toLocaleString()}`;

            await executeGitCommand(`git add ${logFilePath}`, workspacePath);

            await executeGitCommand(`git commit -m "${commitMessage}"`, workspacePath);

            vscode.window.showInformationMessage("Log file committed to Git successfully.");
        } catch (error) {
            vscode.window.showErrorMessage("Failed to commit log file to Git.");
        }
    } else {
        vscode.window.showWarningMessage("Git is not initialized. Log file was not committed.");
    }
}

/**
 * Handles activity tracking for a specific workspace folder.
 * @param workspacePath The path to the workspace folder.
 * @param logFilePath The path to the log file.
 */
function handleActivityTracking(workspacePath: string, logFilePath: string) {
    const configuration = vscode.workspace.getConfiguration(extensionName);
    const timerDuration = configuration.get<number>('timerDurationMinutes', 30) * 60 * 1000; 

    const startOrResumeTimer = () => {
        if (activityTimers[workspacePath]) {
            clearTimeout(activityTimers[workspacePath]);
        }

        activityTimers[workspacePath] = setTimeout(async () => {
            const message = `You spent ${timerDuration} minutes coding as of ${new Date().toISOString()}\n`;

            if (!fs.existsSync(logFilePath)) {
                fs.writeFileSync(logFilePath, message, { flag: 'w' });
                vscode.window.showInformationMessage(`Your log file has been created!`);
                console.log('Log file created and initial message written.');
            } else {
                fs.appendFileSync(logFilePath, message);
                console.log('Message added to existing log file.');
            }

            await commitLogFile(logFilePath, workspacePath);

            // Reset the remaining time for the next period
            remainingTimes[workspacePath] = timerDuration;
            startOrResumeTimer();
        }, remainingTimes[workspacePath]);

        lastActivityTimestamps[workspacePath] = Date.now();
    };

    const pauseTimer = () => {
        if (activityTimers[workspacePath]) {
            clearTimeout(activityTimers[workspacePath]);
            activityTimers[workspacePath] = undefined;
        }

        if (lastActivityTimestamps[workspacePath]) {
            const elapsedTime = Date.now() - lastActivityTimestamps[workspacePath]!;
            remainingTimes[workspacePath] = Math.max(remainingTimes[workspacePath] - elapsedTime, 0);
        }
    };

    const handleActivity = () => {
        pauseTimer();
        startOrResumeTimer();
    };

    vscode.window.onDidChangeTextEditorSelection(handleActivity);
    vscode.workspace.onDidChangeTextDocument(handleActivity);

    // Initialize the timer and remaining time
    remainingTimes[workspacePath] = timerDuration;
    startOrResumeTimer();
}

export function activate(context: vscode.ExtensionContext) {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showWarningMessage(
            `No workspace folder is open. ${extensionName} will not run.`
        );
        return;
    }

     const activateCommand = vscode.commands.registerCommand(
        `${extensionName}.activate`,
        () => {
            vscode.window.showInformationMessage(`${extensionName} is already active.`);
        }
    );

    const restartCommand = vscode.commands.registerCommand(
        `${extensionName}.restart`,
        () => {
            deactivate(); 
            vscode.window.showInformationMessage(`${extensionName} is restarting...`);
            activate(context); 
        }
    );

    const disableCommand = vscode.commands.registerCommand(
        `${extensionName}.disable`,
        () => {
            deactivate(); 
            vscode.window.showInformationMessage(`${extensionName} is now disabled.`);
        }
    );

    for (const folder of vscode.workspace.workspaceFolders) {
        const workspacePath = folder.uri.fsPath;
        const logFilePath = path.join(workspacePath, `${extensionName}-log.txt`);

        handleActivityTracking(workspacePath, logFilePath);
    }

    context.subscriptions.push(activateCommand, restartCommand, disableCommand);

    context.subscriptions.push({
        dispose: () => {
            for (const workspacePath in activityTimers) {
                if (activityTimers[workspacePath]) {
                    clearTimeout(activityTimers[workspacePath]);
                }
            }
        },
    });
}

export function deactivate() {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        for (const folder of vscode.workspace.workspaceFolders) {
            const workspacePath = folder.uri.fsPath;
            const logFilePath = path.join(workspacePath, `${extensionName}-log.txt`);

            if (fs.existsSync(logFilePath)) {
                if (isGitInitialized(workspacePath)) {
                    vscode.window.showWarningMessage(
                        `Log file not deleted because it has not been committed.`
                    );
                } else {
                    try {
                        fs.unlinkSync(logFilePath);
                        console.log('Log file deleted successfully.');
                    } catch (error) {
                        console.error('Error deleting log file:', error);
                    }
                }
            }
        }
    }
}
