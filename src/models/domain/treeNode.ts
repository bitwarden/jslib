export class TreeNode<T extends ITreeNodeObject> {
    node: T;
    children: Array<TreeNode<T>> = [];

    constructor(node: T, name: string) {
        this.node = node;
        this.node.name = name;
    }
}

export interface ITreeNodeObject {
    id: string;
    name: string;
}
