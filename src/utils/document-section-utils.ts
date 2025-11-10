import { Fragment, Node } from 'prosemirror-model';
import { getStyleLevel } from './document-style-utils';
import { StoredStyle } from './table-of-contents-utils';

export type SectionNodeStructure = {
  id: string;
  title: string;
  style: string;
  level: number | null;
  isChecked: boolean;
  children: SectionNodeStructure[];
}

export type FlatSectionNodeStructure = {
  id: string;
  title: string;
  style: string;
  level: number | null;
  isChecked: boolean;
  childrenIds: string[];
}

type NodeContent = Fragment & { content: { text: string }[] }

export function buildSectionStructure(nodeList: Node[], styles: StoredStyle[]): SectionNodeStructure[] {
  const structure = nodeList.reduce((nodes, { ...node }) => {
    const style = node.attrs.styleName;
    const level = getStyleLevel(style, styles) ?? 1;
    const nodeContent = node.content as NodeContent;
    const content = nodeContent.content ?? [];
    const value = {
      id: node.attrs.objectId,
      title: content.length ? content[0].text ?? '' : '',
      style,
      level,
      isChecked: true,
      children: []
    };
    nodes[level] = value.children;
    nodes[level - 1].push(value);
    return nodes;
  }, [[]]).shift();

  return structure;
}

export function flattenStructure(structure: SectionNodeStructure[]): FlatSectionNodeStructure[] {
  const flattenedStructure: FlatSectionNodeStructure[] = [];
  const mutatedStrucutre: SectionNodeStructure[] = structuredClone(structure);

  for (const section of mutatedStrucutre) {
    const baseSection = { ...section };
    delete baseSection.children;
    const flattenedSection: FlatSectionNodeStructure = {
      ...baseSection,
      childrenIds: [],
    };

    if (section.children.length) {
      for (const child of section.children) {
        flattenedSection.childrenIds.push(child.id);
      }

      flattenedStructure.push(flattenedSection);
      flattenedStructure.push(...flattenStructure(section.children)); // NOSONAR
    } else {
      delete section.children;
      flattenedStructure.push(flattenedSection);
    }
  }

  return flattenedStructure;
}

function addSelectedSection(
  flatStructure: FlatSectionNodeStructure[],
  sectionId: string,
  isChildId = false,
): string[] {
  const section = flatStructure.find(section => section.id === sectionId);
  const sectionIdsToAdd = [sectionId];

  if (isChildId) {
    toggleDisableInput(sectionId, false);
  }

  if (section.childrenIds.length) {
    toggleAllSectionChildElements(flatStructure, sectionId, false);
    sectionIdsToAdd.push(...getCheckedChildSection(section, flatStructure));
  }

  for (const section of flatStructure) {
    if (section.childrenIds.includes(sectionId)) {
      section.isChecked = true;
      sectionIdsToAdd.push(...addSelectedSection(flatStructure, section.id, true));
    }
  }

  return sectionIdsToAdd;
}

function getCheckedChildSection(section: FlatSectionNodeStructure, flatStructure: FlatSectionNodeStructure[]): string [] {
  const checkedChildSection: string[] = [];

  for (const id of section.childrenIds) {
    const childSection = flatStructure.find(section => section.id === id);

    if (childSection?.isChecked) {
      checkedChildSection.push(childSection.id);
      checkedChildSection.push(...getCheckedChildSection(childSection, flatStructure)); // NOSONAR
    }
  }

  return checkedChildSection;
}

export function toggleAllSectionChildElements(
  flatStructure: FlatSectionNodeStructure[],
  sectionId: string,
  isDisabled: boolean
): void {
  const section = flatStructure.find(section => section.id === sectionId);

  if (section?.childrenIds?.length && section?.isChecked) {
    for (const id of section.childrenIds) {
      toggleDisableInput(id, isDisabled);
      toggleAllSectionChildElements(flatStructure, id, isDisabled);
    }
  }
}

export function filterDocumentSections(
  renderedDoc: HTMLElement,
  nodes: Node[],
  excludedNodes: string[],
  storedStyles: StoredStyle[]
): HTMLElement {
  const proseMirrorContainer = renderedDoc.getElementsByClassName('ProseMirror')[0] ?? null;

  if (proseMirrorContainer) {
    const tempTocNodeList = JSON.parse(JSON.stringify(nodes));  // NOSONAR 

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

  return renderedDoc;
}

export function buildListOfIdsToAdd(
  sectionId: string,
  currentListOfExcludedIds: string[],
  flatStructure: FlatSectionNodeStructure[]
): string [] {
  const section = flatStructure.find(section => section.id === sectionId);
  section.isChecked = true;

  const ids = addSelectedSection(flatStructure, sectionId);
  let newNodeList = structuredClone(currentListOfExcludedIds);

  newNodeList = newNodeList.filter((nodeId) => !ids.includes(nodeId));

  return sortExcludeListByFlattenedSection(newNodeList, flatStructure);
}

export function buildListOfIdsToRemove(
  sectionId: string,
  currentListOfExcludedIds: string[],
  flatStructure: FlatSectionNodeStructure[]
): string[] {
  let newNodeList = structuredClone(currentListOfExcludedIds);
  const section = flatStructure.find(section => section.id === sectionId);
  section.isChecked = false;

  const allNewIds = getAllSectionIds(section, flatStructure);

  newNodeList = [...newNodeList, ...allNewIds];
  newNodeList = [...new Set(newNodeList)];

  return sortExcludeListByFlattenedSection(newNodeList, flatStructure);
}

function sortExcludeListByFlattenedSection(nodeList: string[], flatStructure: FlatSectionNodeStructure[]): string[] {
  nodeList.sort((a, b) => {
    return flatStructure.findIndex(section => section.id === a) - flatStructure.findIndex(section => section.id === b);
  });

  return nodeList;
}

function getAllSectionIds(section: FlatSectionNodeStructure, flatStructure: FlatSectionNodeStructure[]): string[] {
  let allChildIds = [];

  if (section.childrenIds?.length) {
    for (const id of section.childrenIds) {
      const childSection = flatStructure.find(section => section.id === id);
      const nestedIds = getAllSectionIds(childSection, flatStructure);
      allChildIds = [...allChildIds, ...nestedIds];
    }
  }

  return [section.id , ...allChildIds];
}

function toggleDisableInput(id: string, isChecked: boolean): void {
  const uniqueSectionId = `licit-pdf-export-${id}`;
  const input = document.getElementById(uniqueSectionId) as HTMLInputElement;

  if (input) {
    input.disabled = isChecked;
  }
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

function getIndexBySectionName(collectionArray: Element[], styleName: string): number[] {
  const nodeIndexs = [];

  for (const [index, element] of collectionArray.entries()) {
    if (element.attributes.getNamedItem('stylename')?.value === styleName) {
      nodeIndexs.push(index);
    }
  }

  return nodeIndexs;
}
