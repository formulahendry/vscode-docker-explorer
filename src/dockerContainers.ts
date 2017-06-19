import * as path from "path";
import * as vscode from "vscode";
import { AppInsightsClient } from "./appInsightsClient";
import { Executor } from "./executor";
import { DockerObject } from "./Model/DockerObject";
import { Utility } from "./utility";

export class DockerContainers implements vscode.TreeDataProvider<DockerObject> {
    public _onDidChangeTreeData: vscode.EventEmitter<DockerObject | undefined> = new vscode.EventEmitter<DockerObject | undefined>();
    public readonly onDidChangeTreeData: vscode.Event<DockerObject | undefined> = this._onDidChangeTreeData.event;
    private isErrorMessageShown = false;

    constructor(private context: vscode.ExtensionContext) {
        this.setAutoRefresh();
    }

    public refreshDockerContainers(): void {
        this.isErrorMessageShown = false;
        this._onDidChangeTreeData.fire();
    }

    public getTreeItem(element: DockerObject): vscode.TreeItem {
        return element;
    }

    public getChildren(element?: DockerObject): Thenable<DockerObject[]> {
        const containers = [];
        try {
            const containerStrings = Executor.execSync("docker ps -a --format \"{{.ID}} {{.Names}} {{.Status}}\"").split(/[\r\n]+/g);
            containerStrings.forEach((containerString) => {
                if (containerString) {
                    const items = containerString.split(" ");
                    const image = items[2] === "Up" ? "container-on.png" : "container-off.png";
                    containers.push(new DockerObject(
                        items[0],
                        items[1],
                        this.context.asAbsolutePath(path.join("resources", image)),
                        {
                            command: "docker-explorer.getContainer",
                            title: "",
                            arguments: [items[0]],
                        },
                    ));
                }
            });
        } catch (error) {
            if (!this.isErrorMessageShown) {
                vscode.window.showErrorMessage(`[Failed to list Docker Containers] ${error.stderr}`);
                this.isErrorMessageShown = true;
            }
        }

        return Promise.resolve(containers);
    }

    public getContainer(containerId: string): void {
        Executor.runInTerminal(`docker ps -a --filter "id=${containerId}"`);
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

    public showContainerLogs(containerId: string): void {
        Executor.runInTerminal(`docker logs ${containerId}`);
        AppInsightsClient.sendEvent("showContainerLogs");
    }

    public removeContainer(containerId: string): void {
        Executor.runInTerminal(`docker rm ${containerId}`);
        AppInsightsClient.sendEvent("removeContainer");
    }

    private setAutoRefresh(): void {
        const interval = Utility.getConfiguration().get<number>("autoRefreshInterval");
        if (interval > 0) {
            setInterval(() => {
                this._onDidChangeTreeData.fire();
            }, interval);
        }
    }
}
