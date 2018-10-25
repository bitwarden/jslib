export class TreeNode<T> {
    node: T;
    children: Array<TreeNode<T>> = [];

    constructor(node: T) {
        this.node = node;
    }
}
