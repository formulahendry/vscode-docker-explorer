"use strict";
import * as vscode from "vscode";
import { DockerContainers } from "./dockerContainers";

export function activate(context: vscode.ExtensionContext) {
    const dockerContainers = new DockerContainers(context);
    vscode.window.registerTreeDataProvider("dockerContainers", dockerContainers);
}

export function deactivate() {
}
