import { Command, TreeItem } from "vscode";
import { ACRNode } from "./ACRNode";

export class ACRTreeItem extends TreeItem {
    constructor(
        public readonly node: ACRNode,
        public readonly contextValue: string,
    ) {
        super(`${node.name}`);
    }
}
