import { Node } from 'prosemirror-model';
import { getStyleLevel, isTocStyle } from './document-style-utils';
import { StoredStyle } from './table-of-contents-utils';
import { SectionNodeStructure, NodeContent, FlatSectionNodeStructure } from './document-section-types';


export function buildSectionStructure(nodeList: Node[], styles: StoredStyle[]): SectionNodeStructure[] {
  let currentTitleSection: SectionNodeStructure | null = null;

  const structure = nodeList.reduce((nodes, { ...node }) => {
    const style = node.attrs.styleName;
    const isSectionTitle = isTocStyle(style, styles);
    const level = getStyleLevel(style, styles) ?? 1;
    const nodeContent = node.content as NodeContent;
    const content = nodeContent.content ?? [];
    const capcoString = node.attrs.capco;
    const value = {
      capco: capcoString ? JSON.parse(capcoString) : null,
      childSections: [],
      childNodes: [],
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
      currentTitleSection = value;
      nodes[level] = value.childSections;
      nodes[level - 1].push(value);
    } else if (currentTitleSection) {
      currentTitleSection.childNodes.push(value);
    }

    return nodes;
  }, [[]]).shift();

  return structure;
}

export function flattenStructure(structure: SectionNodeStructure[]): FlatSectionNodeStructure[] {
  const flattenedStructure: FlatSectionNodeStructure[] = [];
  const mutatedStrucutre: SectionNodeStructure[] = structuredClone(structure);

  for (const section of mutatedStrucutre) {
    const baseSection = { ...section };
    delete baseSection.childSections;
    delete baseSection.childNodes;
    const flattenedSection: FlatSectionNodeStructure = {
      ...baseSection,
      childSectionIds: [],
      childNodeIds: [],
    };

    if (section.childNodes.length) {
      for (const child of section.childNodes) {
        flattenedSection.childNodeIds.push(child.id);
      }
    } else {
      delete section.childNodes;
    }

    if (section.childSections.length) {
      for (const child of section.childSections) {
        flattenedSection.childSectionIds.push(child.id);
      }
    } else {
      delete section.childSections;
    }

    flattenedStructure.push(flattenedSection);

    if (section?.childNodes?.length) {
      flattenedStructure.push(...flattenStructure(section.childNodes));
    }

    if (section?.childSections?.length) {
      flattenedStructure.push(...flattenStructure(section.childSections));
    }
  }

  return flattenedStructure;
}

function addSelectedSection(
  flatStructure: FlatSectionNodeStructure[],
  sectionId: string,
  isChildId = false,
  wasSanitized = false,
): string[] {
  const section = flatStructure.find(section => section.id === sectionId);
  const sectionIdsToAdd = [sectionId];

  if (isChildId) {
    toggleDisableInput(section, false);
  }

  if (section.childSectionIds.length) {
    toggleAllSectionChildElements(flatStructure, sectionId, false);
    sectionIdsToAdd.push(...getCheckedChildSection(section, flatStructure));
  }

  for (const nodeSection of flatStructure) {
    if (nodeSection.childSectionIds.includes(sectionId)) {
      if (!wasSanitized) {
        nodeSection.state.isChecked = true;
      }
      sectionIdsToAdd.push(...addSelectedSection(flatStructure, nodeSection.id, true, wasSanitized));
    }
  }

  return sectionIdsToAdd;
}

function getCheckedChildSection(section: FlatSectionNodeStructure, flatStructure: FlatSectionNodeStructure[]): string [] {
  const checkedChildSection: string[] = [];

  for (const id of section.childSectionIds) {
    const childSection = flatStructure.find(section => section.id === id);

    if (childSection?.state.isChecked) {
      checkedChildSection.push(childSection.id);
      checkedChildSection.push(...getCheckedChildSection(childSection, flatStructure));
    }
  }

  return checkedChildSection;
}

export function toggleAllSectionChildElements(
  flatStructure: FlatSectionNodeStructure[],
  sectionId: string,
  parentIsDisabled = false,
  isChild = false,
): void {
  const section = flatStructure.find(section => section.id === sectionId);

  if (isChild && parentIsDisabled) {
    section.state.isDisabled = true;
    toggleDisableInput(section, true);

  }

  if (section?.childSectionIds.length && (section.state.isChecked && !section.state.isSanitized && !parentIsDisabled)) {
    for (const id of section.childSectionIds) {
      const childSection = flatStructure.find(section => section.id === id);
      toggleDisableInput(childSection, false);
      toggleAllSectionChildElements(flatStructure, id, section.state.isDisabled, true);
    }
  } else {
    for (const id of section.childSectionIds) {
      const childSection = flatStructure.find(section => section.id === id);
      toggleDisableInput(childSection, true);
      toggleAllSectionChildElements(flatStructure, id, section.state.isDisabled, true);
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
    const tempTocNodeList = JSON.parse(JSON.stringify(nodes));

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
  flatStructure: FlatSectionNodeStructure[],
  wasSanitized = false,
): string [] {
  const ids = addSelectedSection(flatStructure, sectionId, false, wasSanitized);
  let newNodeList = structuredClone(currentListOfExcludedIds);
  newNodeList = newNodeList.filter((nodeId) => !ids.includes(nodeId));

  return sortExcludeListByFlattenedSection(newNodeList, flatStructure);
}

export function buildListOfIdsToRemove(
  sectionId: string,
  currentListOfExcludedIds: string[],
  flatStructure: FlatSectionNodeStructure[],
): string[] {
  let newNodeList = structuredClone(currentListOfExcludedIds);
  const section = flatStructure.find(section => section.id === sectionId);

  const allNewIds = getAllSectionIds(section, flatStructure);

  newNodeList = [...newNodeList, ...allNewIds];
  newNodeList = [...new Set(newNodeList)];

  return sortExcludeListByFlattenedSection(newNodeList, flatStructure);
}

export function filterDocumentNodes(
  renderedDoc: HTMLElement,
  nodes: Node[],
  excludedNodes: string[],
): HTMLElement {
  const proseMirrorContainer = renderedDoc.getElementsByClassName('ProseMirror')[0] ?? null;
  if (proseMirrorContainer) {
    const tempNodeList = JSON.parse(JSON.stringify(nodes));

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

  return renderedDoc;
}

export function toggleDisableInput(section: FlatSectionNodeStructure, isDisabled: boolean): void {
  const uniqueSectionId = `licit-pdf-export-${section.id}`;
  const input = document.getElementById(uniqueSectionId) as HTMLInputElement;

  if (input) {
    if (section.state.isSanitized) {
      input.disabled = true;
      section.state.isDisabled = true;
      return;
    }

    section.state.isDisabled = isDisabled;
    input.disabled = isDisabled;
  }
}

export function toggleCheckedInput(section: FlatSectionNodeStructure, isChecked: boolean): void {
  const uniqueSectionId = `licit-pdf-export-${section.id}`;
  const input = document.getElementById(uniqueSectionId) as HTMLInputElement;

  if (input) {
    section.state.isChecked = isChecked;
    input.checked = isChecked;
  }
}

function sortExcludeListByFlattenedSection(nodeList: string[], flatStructure: FlatSectionNodeStructure[]): string[] {
  nodeList.sort((a, b) => {
    return flatStructure.findIndex(section => section.id === a) - flatStructure.findIndex(section => section.id === b);
  });

  return nodeList;
}

function getAllSectionIds(section: FlatSectionNodeStructure, flatStructure: FlatSectionNodeStructure[]): string[] {
  let allChildIds = [];

  if (section.childSectionIds.length) {
    for (const id of section.childSectionIds) {
      const childSection = flatStructure.find(section => section.id === id);
      const nestedIds = getAllSectionIds(childSection, flatStructure);
      allChildIds = [...allChildIds, ...nestedIds];
    }
  }

  return [section.id , ...allChildIds];
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
