import {
    ITreeNodeObject,
    TreeNode,
} from '../models/domain/treeNode';

export class ServiceUtils {
    static nestedTraverse(nodeTree: Array<TreeNode<ITreeNodeObject>>, partIndex: number, parts: string[],
        obj: ITreeNodeObject, delimiter: string) {
        if (parts.length <= partIndex) {
            return;
        }

        const end = partIndex === parts.length - 1;
        const partName = parts[partIndex];

        for (let i = 0; i < nodeTree.length; i++) {
            if (nodeTree[i].node.name === parts[partIndex]) {
                if (end && nodeTree[i].node.id !== obj.id) {
                    // Another node with the same name.
                    nodeTree.push(new TreeNode(obj, partName));
                    return;
                }
                this.nestedTraverse(nodeTree[i].children, partIndex + 1, parts, obj, delimiter);
                return;
            }
        }

        if (nodeTree.filter((n) => n.node.name === partName).length === 0) {
            if (end) {
                nodeTree.push(new TreeNode(obj, partName));
                return;
            }
            const newPartName = parts[partIndex] + delimiter + parts[partIndex + 1];
            this.nestedTraverse(nodeTree, 0, [newPartName, ...parts.slice(partIndex + 2)], obj, delimiter);
        }
    }
}
