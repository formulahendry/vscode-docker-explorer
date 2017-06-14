import * as path from "path";
import * as vscode from "vscode";
import { Executor } from "./executor";
import { DockerObject } from "./Model/DockerObject";

export class DockerContainers implements vscode.TreeDataProvider<DockerObject> {
    public _onDidChangeTreeData: vscode.EventEmitter<DockerObject | undefined> = new vscode.EventEmitter<DockerObject | undefined>();
    public readonly onDidChangeTreeData: vscode.Event<DockerObject | undefined> = this._onDidChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext) {
    }

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public getTreeItem(element: DockerObject): vscode.TreeItem {
        return element;
    }

    public getChildren(element?: DockerObject): Thenable<DockerObject[]> {
        const containers = [];
        const containerStrings = Executor.run("docker ps -a --format \"{{.ID}} {{.Names}}\"").split(/[\r\n]+/g);
        containerStrings.forEach((containerString) => {
            const items = containerString.split(" ");
            containers.push(new DockerObject(
                items[0],
                items[1],
                this.context.asAbsolutePath(path.join("resources", "device.png")),
                {
                    command: "azure-iot-toolkit.getDevice",
                    title: "",
                    arguments: [],
                },
            ));
        });
        return Promise.resolve(containers);

        // return new Promise((resolve) => {
        //     const a = new DockerObject(
        //         "a",
        //         "b",
        //         this.context.asAbsolutePath(path.join("resources", "device.png")),
        //         {
        //             command: "azure-iot-toolkit.getDevice",
        //             title: "",
        //             arguments: [],
        //         });
        //     resolve([a]);
        // });
    }
}
