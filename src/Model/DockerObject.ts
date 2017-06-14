import { Command, TreeItem } from "vscode";

export class DockerObject extends TreeItem {
    constructor(
        public readonly id: string,
        public readonly label: string,
        public readonly iconPath: string,
        public readonly command: Command) {
        super(label);
    }
}
