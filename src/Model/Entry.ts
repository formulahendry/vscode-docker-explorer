export class Entry {
    constructor(
        private readonly _name: string,
        private readonly _type: string) {
    }

    public get name(): string {
        return this._name;
    }

    public get type(): string {
        return this._type;
    }
}
