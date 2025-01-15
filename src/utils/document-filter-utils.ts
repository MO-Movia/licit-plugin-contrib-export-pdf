import { Node } from 'prosemirror-model';
import { getStyleLevel } from './document-style-utils';
import { StoredStyle } from './table-of-contents-utils';
import { classificaitonToNumericLevelMap, FlatNodeStructure, SanitizedNodes } from './document-node-types';
import { toggleDisableInput, toggleAllSectionChildElements, getCheckedChildSection, updateSanitization } from './document-state-utils';
import { getEmptyTocNodes } from './document-structure-utils';

export function filterDocumentNodes(
  renderedDoc: HTMLElement,
  nodes: Node[],
  excludedNodes: string[],
  storedStyles: StoredStyle[],
  filterByTocNodes = false,
): HTMLElement {
  const proseMirrorContainer = renderedDoc.getElementsByClassName('ProseMirror')[0] ?? null;

  if (proseMirrorContainer) {
    const tempTocNodeList = JSON.parse(JSON.stringify(nodes));

    if (filterByTocNodes) {
      filterTocNodes(
        proseMirrorContainer,
        tempTocNodeList,
        nodes,
        excludedNodes,
        storedStyles,
      );
    } else {
      filterNormalNodes(
        proseMirrorContainer,
        tempTocNodeList,
        nodes,
        excludedNodes
      );
    }
  }

  return renderedDoc;
}

export function buildSanitizedNodes(
  newTocList: string[],
  newNodeList: string[],
  flattenedNodeStructure: FlatNodeStructure[],
  currentlySanitizedTocNodes: string[],
): string[] {
  const tocList = getEmptyTocNodes(flattenedNodeStructure, newTocList, newNodeList);
  let sanitizedNodes: string[] = [];

  for (const id of currentlySanitizedTocNodes) {
    const node = flattenedNodeStructure.find(section => section.id === id);
    updateSanitization(node, flattenedNodeStructure, false);
    sanitizedNodes = buildListOfIdsToAdd(
      node.id,
      currentlySanitizedTocNodes,
      flattenedNodeStructure,
      true
    );
  }

  for (const nodeId of tocList) {
    const section = flattenedNodeStructure.find(section => section.id === nodeId);
    updateSanitization(section, flattenedNodeStructure, true);
    toggleDisableInput(section, true);
    toggleAllSectionChildElements(flattenedNodeStructure, nodeId, true);

    sanitizedNodes = buildListOfIdsToRemove(
      nodeId,
      sanitizedNodes,
      flattenedNodeStructure,
    );
  }

  return sanitizedNodes;
}

export function buildListOfIdsToAdd(
  sectionId: string,
  currentListOfExcludedIds: string[],
  flatStructure: FlatNodeStructure[],
  sanitizing = false,
): string [] {
  const ids = addSelectedSection(flatStructure, sectionId, false, sanitizing);
  let newNodeList = structuredClone(currentListOfExcludedIds);
  newNodeList = newNodeList.filter((nodeId) => !ids.includes(nodeId));

  return sanitizing ? [] : sortExcludeListByFlattenedSection(newNodeList, flatStructure);
}

export function buildListOfIdsToRemove(
  sectionId: string,
  currentListOfExcludedIds: string[],
  flatNodeStructure: FlatNodeStructure[],
): string[] {
  let newNodeList = structuredClone(currentListOfExcludedIds);
  const section = flatNodeStructure.find(section => section.id === sectionId);
  const allNewIds = getAllSectionIds(section, flatNodeStructure);

  newNodeList = [...newNodeList, ...allNewIds];
  newNodeList = [...new Set(newNodeList)];

  return sortExcludeListByFlattenedSection(newNodeList, flatNodeStructure);
}

export function sortNodesByClassification(
  flatNodeStructure: FlatNodeStructure[],
  sanitizationLevel: number,
): SanitizedNodes {
  const tocNodes: string[] = [];
  const normalNodes: string[] = [];

  for (const node of flatNodeStructure) {
    if (node.capco) {
      const nodeClassification = node.capco.ism.classification[0] ?? 'U';
      const nodeClassificationLevel = classificaitonToNumericLevelMap.get(nodeClassification) ?? 0;

      if (nodeClassificationLevel > sanitizationLevel) {
        node.state.isSanitized = true;

        if (node.state.isSectionTitle) {
          tocNodes.push(node.id);
        } else {
          normalNodes.push(node.id);
        }
      }
    }
  }

  return { tocNodes, normalNodes };
}

function sortExcludeListByFlattenedSection(nodeList: string[], flatStructure: FlatNodeStructure[]): string[] {
  nodeList.sort((a, b) => {
    return flatStructure.findIndex(section => section.id === a) - flatStructure.findIndex(section => section.id === b);
  });

  return nodeList;
}

function getAllSectionIds(section: FlatNodeStructure, flatStructure: FlatNodeStructure[]): string[] {
  let allChildIds = [];

  if (section.children.tocNodeIds.length) {
    for (const id of section.children.tocNodeIds) {
      const childSection = flatStructure.find(section => section.id === id);
      const nestedIds = getAllSectionIds(childSection, flatStructure);
      allChildIds = [...allChildIds, ...nestedIds];
    }
  }

  return [section.id, ...allChildIds];
}

function getIndexBySectionName(collectionArray: Element[], styleName: string): number[] {
  const nodeIndexs = [];

  for (const [index, element] of collectionArray.entries()) {
    if (element.attributes.getNamedItem('stylename')?.value === styleName) {
      nodeIndexs.push(index);
    }
  }

  return nodeIndexs;
}

function deleteDocumentChildElements(
  startingIndex: number,
  sectionElements: HTMLCollection,
  storedStyles: StoredStyle[]
): void {
  let nextSectionStyleName = sectionElements[startingIndex].attributes.getNamedItem('stylename')?.value ?? '';
  let nextElementLevel = getStyleLevel(nextSectionStyleName, storedStyles);

  while (!nextElementLevel && startingIndex < sectionElements.length) {
    sectionElements[startingIndex].remove();

    if (!sectionElements[startingIndex]) break;

    nextSectionStyleName = sectionElements[startingIndex].attributes.getNamedItem('stylename')?.value ?? '';
    nextElementLevel = getStyleLevel(nextSectionStyleName, storedStyles);
  }
}

function addSelectedSection(
  flatStructure: FlatNodeStructure[],
  sectionId: string,
  isChildId = false,
  sanitizing = false,
): string[] {
  const section = flatStructure.find(section => section.id === sectionId);
  const sectionIdsToAdd = [sectionId];

  if (isChildId) {
    toggleDisableInput(section, false);
  }

  if (section.children.tocNodeIds.length) {
    toggleAllSectionChildElements(flatStructure, sectionId, false);
    sectionIdsToAdd.push(...getCheckedChildSection(section, flatStructure));
  }

  for (const nodeSection of flatStructure) {
    if (nodeSection.children.tocNodeIds.includes(sectionId)) {
      if (!sanitizing) nodeSection.state.isChecked = true;
      sectionIdsToAdd.push(...addSelectedSection(flatStructure, nodeSection.id, true, sanitizing));
    }
  }

  return sectionIdsToAdd;
}

function filterTocNodes(
  proseMirrorContainer: Element,
  tempTocNodeList: Node[],
  nodes: Node[],
  excludedNodes: string[],
  storedStyles: StoredStyle[]
): void {
  for (const id of excludedNodes) {
    const node = nodes.find(node => node.attrs.objectId === id);

    if (node?.attrs?.styleName) {
      const nodeStyle = node.attrs.styleName;
      const workingIndexes = tempTocNodeList.filter(node => node.attrs.styleName === nodeStyle);
      const workingSection = workingIndexes.findIndex(node => node.attrs.objectId === id);
      const sectionElements = proseMirrorContainer.children;
      const collectionArray = Array.from(sectionElements);
      const nodeIndexs = getIndexBySectionName(collectionArray, nodeStyle);
      const startingIndex = nodeIndexs[workingSection];
      const sectionLevel = getStyleLevel(nodeStyle, storedStyles);

      if (!sectionLevel || !sectionElements[startingIndex]) break;

      sectionElements[startingIndex].remove();

      if (!sectionElements[startingIndex]) break;

      deleteDocumentChildElements(startingIndex, sectionElements, storedStyles);
    }

    const removedSection = tempTocNodeList.findIndex(node => node.attrs.objectId === id);
    tempTocNodeList.splice(removedSection, 1);
  }
}

function filterNormalNodes(
  proseMirrorContainer: Element,
  tempNodeList: Node[],
  nodes: Node[],
  excludedNodes: string[],
): void {
  for (const id of excludedNodes) {
    const node = nodes.find(node => node.attrs.objectId === id);

    if (node?.attrs?.styleName) {
      const nodeStyle = node.attrs.styleName;
      const workingIndexes = tempNodeList.filter(node => node.attrs.styleName === nodeStyle);
      const workingSection = workingIndexes.findIndex(node => node.attrs.objectId === id);
      const sectionElements = proseMirrorContainer.children;
      const collectionArray = Array.from(sectionElements);
      const nodeIndexs = getIndexBySectionName(collectionArray, nodeStyle);
      const startingIndex = nodeIndexs[workingSection];

      if (sectionElements[startingIndex]) {
        sectionElements[startingIndex].remove();
      }
    }

    const removedSection = tempNodeList.findIndex(node => node.attrs.objectId === id);
    tempNodeList.splice(removedSection, 1);
  }
}
