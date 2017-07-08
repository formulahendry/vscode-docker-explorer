import { Command, TreeItem } from "vscode";

export class DockerImage extends TreeItem {
    constructor(
        public readonly id: string,
        public readonly repository: string,
        public readonly tag: string,
        public readonly iconPath: string,
        public readonly command: Command) {
        super(`${repository}:${tag}`);
    }
}
