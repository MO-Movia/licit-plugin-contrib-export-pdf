import { Node } from 'prosemirror-model';
import { getStyleLevel, isTocStyle } from './document-style-utils';
import { StoredStyle } from './table-of-contents-utils';
import { NodeStructure, NodeContent, FlatNodeStructure } from './document-node-types';

export function buildNodeStructure(nodeList: Node[], styles: StoredStyle[]): NodeStructure[] {
  let currentNode: NodeStructure | null = null;

  const structure = nodeList.reduce((nodes, { ...node }) => {
    const style = node.attrs.styleName;
    const isSectionTitle = isTocStyle(style, styles);
    const level = getStyleLevel(style, styles) ?? 1;
    const nodeContent = node.content as NodeContent;
    const content = nodeContent.content ?? [];
    const capcoString = node.attrs.capco;
    const value = {
      capco: capcoString ? JSON.parse(capcoString) : null,
      children: {
        normalNodes: [],
        tocNodes: [],
      },
      id: node.attrs.objectId,
      level,
      state: {
        isChecked: true,
        isDisabled: false,
        isSanitized: false,
        isSectionTitle,
      },
      style,
      title: content.length ? content[0].text ?? '' : '',
    };

    if (isSectionTitle) {
      currentNode = value;
      nodes[level] = value.children.tocNodes;
      nodes[level - 1].push(value);
    } else if (currentNode) {
      currentNode.children.normalNodes.push(value);
    }

    return nodes;
  }, [[]]).shift();

  return structure;
}

export function flattenNodeStructure(nodeStructure: NodeStructure[]): FlatNodeStructure[] {
  const flattenedNodeStructure: FlatNodeStructure[] = [];
  const mutatedNodeStructure: NodeStructure[] = structuredClone(nodeStructure);

  for (const node of mutatedNodeStructure) {
    const basenode = structuredClone(node);
    delete basenode.children.tocNodes;
    delete basenode.children.normalNodes;
    let flattenedSection: FlatNodeStructure = {
      ...basenode,
      children: {
        normalNodeIds: [],
        tocNodeIds: [],
      }
    };

    flattenedSection = buildchildNodes(node, flattenedSection);
    flattenedSection = buildchildSections(node, flattenedSection);

    flattenedNodeStructure.push(flattenedSection);
    flattenedNodeStructure.push(...flattenNodeStructure(node.children.normalNodes));
    flattenedNodeStructure.push(...flattenNodeStructure(node.children.tocNodes));
  }

  return flattenedNodeStructure;
}

export function getEmptyTocNodes(
  flatNodeStructure: FlatNodeStructure[],
  currentTocList: string[],
  currentNodeList: string[],
): string[] {
  const emptyNodes: string[] = [...currentTocList];

  for (const node of flatNodeStructure) {
    if (node.state.isSectionTitle && node?.children.normalNodeIds.length && currentNodeList.length) {
      const noChildrenToRender = node.children.normalNodeIds.every(nodeId => currentNodeList.includes(nodeId));

      if (noChildrenToRender) {
        emptyNodes.push(node.id);
      }
    }
  }

  return emptyNodes;
}

function buildchildNodes(
  node: NodeStructure,
  flattenedSection: FlatNodeStructure,
): FlatNodeStructure {
  if (node.children.normalNodes.length) {
    for (const child of node.children.normalNodes) {
      flattenedSection.children.normalNodeIds.push(child.id);
    }
  }

  return flattenedSection;
}

function buildchildSections(
  node: NodeStructure,
  flattenedSection: FlatNodeStructure,
): FlatNodeStructure {
  if (node.children.tocNodes.length) {
    for (const child of node.children.tocNodes) {
      flattenedSection.children.tocNodeIds.push(child.id);
    }
  }

  return flattenedSection;
}