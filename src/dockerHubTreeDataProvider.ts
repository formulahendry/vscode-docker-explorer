import * as path from "path";
import * as vscode from "vscode";
import { AppInsightsClient } from "./appInsightsClient";
import { DockerHubManager } from "./DockerHub/DockerHubManager";
import { DockerTreeBase } from "./dockerTreeBase";
import { Executor } from "./executor";
import { DockerHubNode } from "./Model/DockerHubNode";

export class DockerHubTreeDataProvider extends DockerTreeBase<DockerHubNode> implements vscode.TreeDataProvider<DockerHubNode> {

    constructor(context: vscode.ExtensionContext) {
        super(context);
    }

    public getTreeItem(element: DockerHubNode): vscode.TreeItem {
        const item = {
            label: element.name,
            collapsibleState: element.isImage ? void 0 : vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: element.isImage ? "image" : "repo",
            iconPath: this.context.asAbsolutePath(path.join("resources", "image.png")),
        };
        return item;
    }

    public getChildren(element?: DockerHubNode): DockerHubNode[] | Thenable<DockerHubNode[]> {
        if (!element) {
            return DockerHubManager.Instance.listRepositories();
        }
        return DockerHubManager.Instance.getTagsForRepo(element);
    }

    public login() {
        let user = "";
        let pwd = "";
        this.getUserCredential()
        .then((credential) => {
            user = credential[0];
            pwd = credential[1];
            return DockerHubManager.Instance.login(user, pwd);
        })
        .then(() => {
            Executor.exec(`docker login -u ${user} -p ${pwd}`);
            return this._onDidChangeTreeData.fire();
        })
        .catch((error) => {
            vscode.window.showErrorMessage(error);
        });
        AppInsightsClient.sendEvent("loginDockerHub");
    }

    public logout() {
        DockerHubManager.Instance.logout();
        this._onDidChangeTreeData.fire();
        AppInsightsClient.sendEvent("logoutDockerHub");
    }

    public refresh() {
        this._onDidChangeTreeData.fire();
        AppInsightsClient.sendEvent("refreshDockerHub");
    }

    public pullFromHub(repo: string, tag: string) {
        Executor.runInTerminal(`docker pull ${repo}:${tag}`);
        AppInsightsClient.sendEvent("pullFromHub");
    }

    private getUserCredential(): Promise<string[]> {
        const userAndPassword = [];
        return new Promise((resolve, reject) => {
            vscode.window.showInputBox({prompt: "Enter user name."})
            .then((val) => {
                if (!val || val.trim().length === 0) {
                    reject("Invalid user name.");
                    return;
                }
                userAndPassword.push(val);
                return vscode.window.showInputBox({
                    prompt: "Enter password.",
                    password: true,
                    placeHolder: "Password",
                });
            })
            .then((val) => {
                if (!val || val.trim().length === 0) {
                    return reject("Invalid password.");
                }
                userAndPassword.push(val);
                return resolve(userAndPassword);
            });
        });
    }
}
