"use strict";
import { execSync } from "child_process";
import * as vscode from "vscode";

export class Executor {
    public static run(command: string, showInOutputChannel: boolean = true): string {
        if (showInOutputChannel) {
            this.channel.show();
            this.channel.appendLine(`>> ${command}`);
        }
        const result = execSync(command, { encoding: "utf8" });
        if (showInOutputChannel) {
            this.channel.appendLine(result);
        }
        return result;
    }

    private static channel = vscode.window.createOutputChannel("Docker Explorer");
}
