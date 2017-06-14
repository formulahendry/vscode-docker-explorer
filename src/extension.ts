"use strict";
import * as vscode from "vscode";
import { AppInsightsClient } from "./appInsightsClient";
import { DockerContainers } from "./dockerContainers";
import { Executor } from "./executor";

export function activate(context: vscode.ExtensionContext) {
    const dockerContainers = new DockerContainers(context);
    vscode.window.registerTreeDataProvider("dockerContainers", dockerContainers);
    AppInsightsClient.sendEvent("loadExtension");

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.refreshdockerContainers", () => {
        dockerContainers.refreshdockerContainers();
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.getContainer", (containerId) => {
        dockerContainers.getContainer(containerId);
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.startContainer", (container) => {
        dockerContainers.startContainer(container.id);
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.stopContainer", (container) => {
        dockerContainers.stopContainer(container.id);
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.restartContainer", (container) => {
        dockerContainers.restartContainer(container.id);
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.showContainerStatistics", (container) => {
        dockerContainers.showContainerStatistics(container.id);
    }));

    context.subscriptions.push(vscode.window.onDidCloseTerminal((closedTerminal: vscode.Terminal) => {
        Executor.onDidCloseTerminal(closedTerminal);
    }));
}

export function deactivate() {
}
