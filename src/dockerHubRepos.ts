import * as path from "path";
import * as vscode from "vscode";
import { AppInsightsClient } from "./appInsightsClient";
import { DockerHubManager } from "./DockerHub/DockerHubManager";
import { DockerTreeBase } from "./dockerTreeBase";
import { Executor } from "./executor";
import { DockerHubRepo } from "./Model/DockerHubRepo";

export class DockerHubRepos extends DockerTreeBase<DockerHubRepo> implements vscode.TreeDataProvider<DockerHubRepo> {

    constructor(context: vscode.ExtensionContext) {
        super(context);
    }

    public getTreeItem(element: DockerHubRepo): vscode.TreeItem {
        return element;
    }

    public getChildren(element?: DockerHubRepo): Thenable<DockerHubRepo[]> {
        const repos = [];
        try {
            for (const key of DockerHubManager.Instance.repos.keys()) {
                repos.push(new DockerHubRepo(
                    DockerHubManager.Instance.userName,
                    key,
                    this.context.asAbsolutePath(path.join("resources", "image.png")),
                ));
            }
        } catch (error) {
            vscode.window.showErrorMessage(`[Failed to list Docker Hub Repos] ${error.stderr}`);
        }

        return Promise.resolve(repos);
    }

    public pullFromHub(user: string, name: string): void {
        vscode.window.showQuickPick(DockerHubManager.Instance.repos.get(name))
        .then((tag) => {
            Executor.runInTerminal(`docker pull ${user}/${name}:${tag}`);
            AppInsightsClient.sendEvent("pullFromHub");
        });
    }
}
