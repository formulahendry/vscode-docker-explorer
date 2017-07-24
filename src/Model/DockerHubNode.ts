import * as path from "path";
import { Command, TreeItem } from "vscode";
import { Entry } from "./Entry";

export class DockerHubNode extends TreeItem {
    constructor(
        private readonly _entry: Entry,
        private readonly _parent: string) {
        super(_entry.name);
    }

    public get parent(): string {
        return this._parent;
    }

    public get path(): string {
        return path.join(this._parent, this.name);
    }

    public get name(): string {
        return this._entry.name;
    }

    public get isImage(): boolean {
        return this._entry.type === "i";
    }
}
