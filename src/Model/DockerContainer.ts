import { Command, TreeItem } from "vscode";

export class DockerContainer extends TreeItem {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly image: string,
        public readonly iconPath: string,
        public readonly command: Command) {
        super(`${name} \u2013 ${image}`);
    }
}
