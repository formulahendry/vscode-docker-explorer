import * as path from "path";
import * as vscode from "vscode";
import { AppInsightsClient } from "./appInsightsClient";
import { Executor } from "./executor";
import { DockerContainer } from "./Model/DockerContainer";
import { Utility } from "./utility";

export class DockerContainers implements vscode.TreeDataProvider<DockerContainer> {
    public _onDidChangeTreeData: vscode.EventEmitter<DockerContainer | undefined> = new vscode.EventEmitter<DockerContainer | undefined>();
    public readonly onDidChangeTreeData: vscode.Event<DockerContainer | undefined> = this._onDidChangeTreeData.event;
    private isErrorMessageShown = false;
    private containerStrings = [];
    private _debounceTimer: NodeJS.Timer;

    constructor(private context: vscode.ExtensionContext) {
    }

    public refreshDockerContainers(): void {
        this.isErrorMessageShown = false;
        this._onDidChangeTreeData.fire();
    }

    public searchContainer(): void {
        const interval = Utility.getConfiguration().get<number>("autoRefreshInterval");
        let containerStrings = [];
        if (interval > 0 && this.containerStrings.length > 0) {
            this.containerStrings.forEach((containerString) => {
                const items = containerString.split(" ");
                containerStrings.push(`${items[1]} (${items[2]})`);
            });
        } else {
            containerStrings = Executor.execSync("docker ps -a --format \"{{.Names}} ({{.Image}})\"").split(/[\r\n]+/g).filter((item) => item);
        }

        vscode.window.showQuickPick(containerStrings, { placeHolder: "Search Docker Container" }).then((containerString) => {
            if (containerString !== undefined) {
                const items = containerString.split(" ");
                this.getContainer(items[0]);
            }
        });
    }

    public getTreeItem(element: DockerContainer): vscode.TreeItem {
        return element;
    }

    public getChildren(element?: DockerContainer): Thenable<DockerContainer[]> {
        const containers = [];
        try {
            this.containerStrings = Executor.execSync("docker ps -a --format \"{{.ID}} {{.Names}} {{.Image}} {{.Status}}\"")
                .split(/[\r\n]+/g).filter((item) => item);
            this.containerStrings.forEach((containerString) => {
                const items = containerString.split(" ");
                const image = items[3] === "Up" ? "container-on.png" : "container-off.png";
                containers.push(new DockerContainer(
                    items[0],
                    items[1],
                    items[2],
                    this.context.asAbsolutePath(path.join("resources", image)),
                    {
                        command: "docker-explorer.getContainer",
                        title: "",
                        arguments: [items[1]],
                    },
                ));
            });
        } catch (error) {
            if (!this.isErrorMessageShown) {
                vscode.window.showErrorMessage(`[Failed to list Docker Containers] ${error.stderr}`);
                this.isErrorMessageShown = true;
            }
        } finally {
            this.setAutoRefresh();
        }

        return Promise.resolve(containers);
    }

    public getContainer(containerName: string): void {
        Executor.runInTerminal(`docker ps -a --filter "name=${containerName}"`);
        AppInsightsClient.sendEvent("getContainer");
    }

    public startContainer(containerName: string): void {
        Executor.runInTerminal(`docker start ${containerName}`);
        AppInsightsClient.sendEvent("startContainer");
    }

    public stopContainer(containerName: string): void {
        Executor.runInTerminal(`docker stop ${containerName}`);
        AppInsightsClient.sendEvent("stopContainer");
    }

    public restartContainer(containerName: string): void {
        Executor.runInTerminal(`docker restart ${containerName}`);
        AppInsightsClient.sendEvent("restartContainer");
    }

    public showContainerStatistics(containerName: string): void {
        Executor.runInTerminal(`docker stats ${containerName}`);
        AppInsightsClient.sendEvent("showContainerStatistics");
    }

    public showContainerLogs(containerName: string): void {
        Executor.runInTerminal(`docker logs ${containerName}`);
        AppInsightsClient.sendEvent("showContainerLogs");
    }

    public removeContainer(containerName: string): void {
        Executor.runInTerminal(`docker rm ${containerName}`);
        AppInsightsClient.sendEvent("removeContainer");
    }

    private setAutoRefresh(): void {
        const interval = Utility.getConfiguration().get<number>("autoRefreshInterval");
        if (interval > 0) {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => {
                this._onDidChangeTreeData.fire();
            }, interval);
        }
    }
}
