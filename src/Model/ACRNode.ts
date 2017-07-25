export class ACRNode {
    constructor(
        public readonly name: string,
        public readonly children: ACRNode[],
        public readonly parent: ACRNode,
        public readonly type: string,
    ) { }
}
