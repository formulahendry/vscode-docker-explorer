import * as path from "path";
import * as vscode from "vscode";
import { AppInsightsClient } from "./appInsightsClient";
import { Executor } from "./executor";
import { DockerObject } from "./Model/DockerObject";

export class DockerContainers implements vscode.TreeDataProvider<DockerObject> {
    public _onDidChangeTreeData: vscode.EventEmitter<DockerObject | undefined> = new vscode.EventEmitter<DockerObject | undefined>();
    public readonly onDidChangeTreeData: vscode.Event<DockerObject | undefined> = this._onDidChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext) {
    }

    public refreshdockerContainers(): void {
        this._onDidChangeTreeData.fire();
        AppInsightsClient.sendEvent("refreshdockerContainers");
    }

    public getTreeItem(element: DockerObject): vscode.TreeItem {
        return element;
    }

    public getChildren(element?: DockerObject): Thenable<DockerObject[]> {
        const containers = [];
        const containerStrings = Executor.execSync("docker ps -a --format \"{{.ID}} {{.Names}}\"").split(/[\r\n]+/g);
        containerStrings.forEach((containerString) => {
            if (containerString) {
                const items = containerString.split(" ");
                containers.push(new DockerObject(
                    items[0],
                    items[1],
                    this.context.asAbsolutePath(path.join("resources", "container.png")),
                    {
                        command: "docker-explorer.getContainer",
                        title: "",
                        arguments: [items[0]],
                    },
                ));
            }
        });
        return Promise.resolve(containers);
    }

    public getContainer(containerId: string): void {
        Executor.runInTerminal(`docker ps --filter "id=${containerId}"`);
        AppInsightsClient.sendEvent("getContainer");
    }

    public startContainer(containerId: string): void {
        Executor.runInTerminal(`docker start ${containerId}`);
        AppInsightsClient.sendEvent("startContainer");
    }

    public stopContainer(containerId: string): void {
        Executor.runInTerminal(`docker stop ${containerId}`);
        AppInsightsClient.sendEvent("stopContainer");
    }

    public restartContainer(containerId: string): void {
        Executor.runInTerminal(`docker restart ${containerId}`);
        AppInsightsClient.sendEvent("restartContainer");
    }

    public showContainerStatistics(containerId: string): void {
        Executor.runInTerminal(`docker stats ${containerId}`);
        AppInsightsClient.sendEvent("showContainerStatistics");
    }
}
