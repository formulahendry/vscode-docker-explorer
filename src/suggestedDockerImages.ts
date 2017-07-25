import * as path from "path";
import * as vscode from "vscode";
import { AppInsightsClient } from "./appInsightsClient";
import { DockerTreeBase } from "./dockerTreeBase";
import { Executor } from "./executor";
import { DockerHubRepo } from "./Model/DockerHubRepo";
import { Utility } from "./utility";

export class SuggestedDockerImages extends DockerTreeBase<DockerHubRepo> implements vscode.TreeDataProvider<DockerHubRepo> {
    constructor(context: vscode.ExtensionContext) {
        super(context);
    }

    public getTreeItem(element: DockerHubRepo): vscode.TreeItem {
        return element;
    }

    public getChildren(element?: DockerHubRepo): Thenable<DockerHubRepo[]> {
        if (vscode.window.activeTextEditor) {
            const document = vscode.window.activeTextEditor.document;

            if (document && document.languageId !== "plaintext") {
                const images = this.suggestImage(document.languageId, document.fileName);

                return Promise.resolve(images);
            }
        }
    }

    public suggestImage(languageId: string, fileName: string): DockerHubRepo[] {
        const images = [];
        try {
            const searchQuery = this.getSearchQuery(languageId, fileName);

            let imageStrings = Executor.execSync(`docker search ${searchQuery} --limit 5`)
                .split(/[\r\n]+/g);
            imageStrings = imageStrings.slice(1, imageStrings.length - 1);
            imageStrings.forEach((imageString) => {
                const repoName = imageString.split(" ")[0];
                let user: string;
                let repository: string;

                // Unofficial repos (such as "kaggle/python") have a "/" in their name separating user and repository,
                // while official ones (such as "python") don't.
                if (repoName.indexOf("/") >= 0) {
                    user = repoName.split("/")[0];
                    repository = repoName.split("/")[1];
                } else {
                    user = null;
                    repository = repoName;
                }

                images.push(new DockerHubRepo(
                    user,
                    repository,
                    this.context.asAbsolutePath(path.join("resources", "image.png")),
                ));
            });
        } catch (error) {
            if (!DockerTreeBase.isErrorMessageShown) {
                vscode.window.showErrorMessage(`[Failed to list Docker Images] ${error.stderr}`);
                DockerTreeBase.isErrorMessageShown = true;
            }
        }

        return images;
    }

    public pullFromHub(user: string, repository: string): void {
        Executor.runInTerminal(`docker pull ${user == null ? repository : user + "/" + repository}`);
        AppInsightsClient.sendEvent("pullSuggestedImageFromHub");
    }

    private getSearchQuery(languageId: string, fileName: string): string {
        switch (languageId) {
            case "csharp": {
            }
            case "fsharp": {
            }
            case "vb": {
                return `\"${languageId} dotnet\"`;
            }
        }

        return languageId;
    }
}
