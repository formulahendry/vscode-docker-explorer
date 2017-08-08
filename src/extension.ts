"use strict";
import * as vscode from "vscode";
import { AppInsightsClient } from "./appInsightsClient";
import { AzureContainerRegistries } from "./azureContainerRegistries";
import { DockerContainers } from "./dockerContainers";
import { DockerHubManager } from "./DockerHub/DockerHubManager";
import { DockerHubTreeDataProvider } from "./dockerHubTreeDataProvider";
import { DockerImages } from "./dockerImages";
import { Executor } from "./executor";
import { SuggestedDockerImages } from "./suggestedDockerImages";

export function activate(context: vscode.ExtensionContext) {
    const dockerContainers = new DockerContainers(context);
    vscode.window.registerTreeDataProvider("dockerContainers", dockerContainers);
    const dockerImages = new DockerImages(context);
    vscode.window.registerTreeDataProvider("dockerImages", dockerImages);
    const azureContainerRegistries = new AzureContainerRegistries(context);
    vscode.window.registerTreeDataProvider("azureRegistries", azureContainerRegistries);
    const suggestedDockerImages = new SuggestedDockerImages(context);
    vscode.window.registerTreeDataProvider("suggestedDockerImages", suggestedDockerImages);
    const dockerHubTreeDataProvider = new DockerHubTreeDataProvider(context);
    vscode.window.registerTreeDataProvider("DockerHubTreeView", dockerHubTreeDataProvider);
    AppInsightsClient.sendEvent("loadExtension");

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.refreshDockerContainers", () => {
        dockerContainers.refreshDockerTree();
        AppInsightsClient.sendEvent("refreshDockerContainers");
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.searchContainer", () => {
        dockerContainers.searchContainer();
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.getContainer", (containerName) => {
        dockerContainers.getContainer(containerName);
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.startContainer", (container) => {
        dockerContainers.startContainer(container.name);
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.stopContainer", (container) => {
        dockerContainers.stopContainer(container.name);
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.restartContainer", (container) => {
        dockerContainers.restartContainer(container.name);
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.showContainerStatistics", (container) => {
        dockerContainers.showContainerStatistics(container.name);
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.showContainerLogs", (container) => {
        dockerContainers.showContainerLogs(container.name);
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.removeContainer", (container) => {
        dockerContainers.removeContainer(container.name);
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.executeCommandInContainer", (container) => {
        dockerContainers.executeCommandInContainer(container.name);
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.executeInBashInContainer", (container) => {
        dockerContainers.executeInBashInContainer(container.name);
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.refreshDockerImages", () => {
        dockerImages.refreshDockerTree();
        AppInsightsClient.sendEvent("refreshDockerImages");
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.getImage", (repository, tag) => {
        dockerImages.getImage(repository, tag);
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.runFromImage", (image) => {
        dockerImages.runFromImage(image.repository, image.tag);
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.removeImage", (image) => {
        dockerImages.removeImage(image.repository, image.tag);
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.pushImage", (image) => {
        dockerImages.pushImage(image.repository, image.tag);
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.refreshDockerHub", () => {
        dockerHubTreeDataProvider.refresh();
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.loginDockerHub", () => {
        dockerHubTreeDataProvider.login();
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.logoutDockerHub", () => {
        dockerHubTreeDataProvider.logout();
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.pullFromDockerHub", (element) => {
        dockerHubTreeDataProvider.pullFromHub(element.parent, element.name);
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.pullLatestFromDockerHub", (repo) => {
        suggestedDockerImages.pullFromHub(repo.user, repo.repository);
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.openDockerHubPage", (repo) => {
        AppInsightsClient.sendEvent("openDockerHubPage");
        let urlPrefix = "https://hub.docker.com/r/";

        if (repo.parent == null) {
            // when the context menu is invoked in "Suggested Docker Hub images" tree, repo.parent is null
            if (repo.user == null) {
                // when the context menu is invoked on an official image, repo.user is null
                urlPrefix = "https://hub.docker.com/_/";
            }
            vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(`${urlPrefix + repo.label}`));
        } else {
            // when the context menu is invoked in "Docker Hub images" tree, repo.parent is {user}/{image}
            vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(`${urlPrefix + repo.parent}`));
        }
    }));

    context.subscriptions.push(vscode.window.onDidCloseTerminal((closedTerminal: vscode.Terminal) => {
        Executor.onDidCloseTerminal(closedTerminal);
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.pullImage", (tagItem) => {
        azureContainerRegistries.pullImage(tagItem.node.name, tagItem.node.parent.name, tagItem.node.parent.parent.name);
        AppInsightsClient.sendEvent("pullImageFromACR");
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.deployToAzure", (tagItem) => {
        azureContainerRegistries.deployToAzure(tagItem.node.name, tagItem.node.parent.name, tagItem.node.parent.parent.name);
        AppInsightsClient.sendEvent("deployToAzure");
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.loginAzureCli", () => {
        azureContainerRegistries.login();
        AppInsightsClient.sendEvent("loginAzureCli");
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.logoutAzureCli", () => {
        azureContainerRegistries.logout();
        AppInsightsClient.sendEvent("logoutAzureCli");
    }));

    context.subscriptions.push(vscode.commands.registerCommand("docker-explorer.refreshAzureRegistries", () => {
        azureContainerRegistries.refreshDockerTree();
        AppInsightsClient.sendEvent("refreshAzureRegistry");
    }));

    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
        suggestedDockerImages._onDidChangeTreeData.fire();
    }));
}

export function deactivate() {
}
