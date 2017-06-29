"use strict";
import { execSync } from "child_process";
import * as vscode from "vscode";

export class Executor {
    public static runInTerminal(command: string, addNewLine: boolean = true): void {
        if (this.terminal === null) {
            this.terminal = vscode.window.createTerminal("Docker Explorer");
        }
        this.terminal.show();
        this.terminal.sendText(command, addNewLine);
    }

    public static execSync(command: string) {
        return execSync(command, { encoding: "utf8" });
    }

    public static onDidCloseTerminal(closedTerminal: vscode.Terminal): void {
        if (this.terminal === closedTerminal) {
            this.terminal = null;
        }
    }

    private static terminal = vscode.window.createTerminal("Docker Explorer");
}
