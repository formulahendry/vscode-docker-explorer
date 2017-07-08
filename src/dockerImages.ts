import * as path from "path";
import * as vscode from "vscode";
import { AppInsightsClient } from "./appInsightsClient";
import { DockerTreeBase } from "./dockerTreeBase";
import { Executor } from "./executor";
import { DockerImage } from "./Model/DockerImage";
import { Utility } from "./utility";

export class DockerImages extends DockerTreeBase<DockerImage> implements vscode.TreeDataProvider<DockerImage> {
    constructor(context: vscode.ExtensionContext) {
        super(context);
    }

    public getTreeItem(element: DockerImage): vscode.TreeItem {
        return element;
    }

    public getChildren(element?: DockerImage): Thenable<DockerImage[]> {
        const images = [];
        try {
            const imageStrings = Executor.execSync("docker images --filter \"dangling=false\" --format \"{{.ID}} {{.Repository}} {{.Tag}}\"")
                .split(/[\r\n]+/g).filter((item) => item);
            imageStrings.forEach((imageString) => {
                const items = imageString.split(" ");
                images.push(new DockerImage(
                    items[0],
                    items[1],
                    items[2],
                    this.context.asAbsolutePath(path.join("resources", "image.png")),
                    {
                        command: "docker-explorer.getImage",
                        title: "",
                        arguments: [items[1], items[2]],
                    },
                ));
            });
        } catch (error) {
            if (!DockerTreeBase.isErrorMessageShown) {
                vscode.window.showErrorMessage(`[Failed to list Docker Images] ${error.stderr}`);
                DockerTreeBase.isErrorMessageShown = true;
            }
        } finally {
            this.setAutoRefresh();
        }

        return Promise.resolve(images);
    }

    public getImage(repository: string, tag: string): void {
        Executor.runInTerminal(`docker images ${repository}:${tag}`);
        AppInsightsClient.sendEvent("getImage");
    }

    public runFromImage(repository: string, tag: string): void {
        Executor.runInTerminal(`docker run -it ${repository}:${tag}`);
        AppInsightsClient.sendEvent("runFromImage");
    }

    public removeImage(repository: string, tag: string): void {
        Executor.runInTerminal(`docker rmi ${repository}:${tag}`);
        AppInsightsClient.sendEvent("removeImage");
    }
}
