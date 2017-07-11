import * as path from "path";
import * as vscode from "vscode";
import { AppInsightsClient } from "./appInsightsClient";
import { DockerTreeBase } from "./dockerTreeBase";
import { Executor } from "./executor";
import { DockerContainer } from "./Model/DockerContainer";
import { Utility } from "./utility";

export class DockerContainers extends DockerTreeBase<DockerContainer> implements vscode.TreeDataProvider<DockerContainer> {
    private containerStrings = [];

    constructor(context: vscode.ExtensionContext) {
        super(context);
    }

    public searchContainer(): void {
        AppInsightsClient.sendEvent("searchContainer");
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
            if (!DockerTreeBase.isErrorMessageShown) {
                vscode.window.showErrorMessage(`[Failed to list Docker Containers] ${error.stderr}`);
                DockerTreeBase.isErrorMessageShown = true;
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
        this.refreshDockerTree();
        AppInsightsClient.sendEvent("startContainer");
    }

    public stopContainer(containerName: string): void {
        Executor.runInTerminal(`docker stop ${containerName}`);
        this.refreshDockerTree();
        AppInsightsClient.sendEvent("stopContainer");
    }

    public restartContainer(containerName: string): void {
        Executor.runInTerminal(`docker restart ${containerName}`);
        this.refreshDockerTree();
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
        this.refreshDockerTree();
        AppInsightsClient.sendEvent("removeContainer");
    }

    public executeCommandInContainer(containerName: string): void {
        const command = Utility.getConfiguration().get<string>("executionCommand");
        if (command) {
            Executor.runInTerminal(`docker exec ${containerName} ${command}`);
        } else {
            Executor.runInTerminal(`docker exec ${containerName} `, false);
        }
        AppInsightsClient.sendEvent("executeCommandInContainer", command ? { executionCommand: command } : {});
    }

    public executeInBashInContainer(containerName: string): void {
        Executor.runInTerminal(`docker exec -it ${containerName} bash`);
        AppInsightsClient.sendEvent("executeInBashInContainer");
    }
}
