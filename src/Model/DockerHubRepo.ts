import { Command, TreeItem } from "vscode";

export class DockerHubRepo extends TreeItem {
    constructor(
        public readonly user: string,
        public readonly repository: string,
        public readonly iconPath: string) {
        // if the repo is official, user is null
        super(user == null ? `${repository}` : `${user}/${repository}`);
    }
}
