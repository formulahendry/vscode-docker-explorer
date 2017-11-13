"use strict";
import * as vscode from "vscode";

export class Utility {
    public static getConfiguration(): vscode.WorkspaceConfiguration {
        return vscode.workspace.getConfiguration("docker-explorer");
    }

    public static isArrayEqual(a: string[], b: string[]): boolean {
        return JSON.stringify(a.sort()) === JSON.stringify(b.sort());
    }
}
