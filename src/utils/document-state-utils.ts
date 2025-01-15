import { FlatNodeStructure } from './document-node-types';

export function toggleAllSectionChildElements(
  flatStructure: FlatNodeStructure[],
  sectionId: string,
  parentIsDisabled = false,
  isChild = false,
): void {
  const section = flatStructure.find(section => section.id === sectionId);

  if (isChild && parentIsDisabled) {
    section.state.isDisabled = true;
    toggleDisableInput(section, true);

  }

  if (section?.children.tocNodeIds.length && (section.state.isChecked && !section.state.isSanitized && !parentIsDisabled)) {
    for (const id of section.children.tocNodeIds) {
      const childSection = flatStructure.find(section => section.id === id);
      toggleDisableInput(childSection, false);
      toggleAllSectionChildElements(flatStructure, id, section.state.isDisabled, true);
    }

    return;
  }

  for (const id of section.children.tocNodeIds) {
    const childSection = flatStructure.find(section => section.id === id);
    toggleDisableInput(childSection, true);
    toggleAllSectionChildElements(flatStructure, id, section.state.isDisabled, true);
  }
}

export function toggleDisableInput(section: FlatNodeStructure, isDisabled: boolean): void {
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

export function toggleCheckedInput(section: FlatNodeStructure, isChecked: boolean): void {
  const uniqueSectionId = `licit-pdf-export-${section.id}`;
  const input = document.getElementById(uniqueSectionId) as HTMLInputElement;

  if (input) {
    section.state.isChecked = isChecked;
    input.checked = isChecked;
  }
}

export function getCheckedChildSection(section: FlatNodeStructure, flatStructure: FlatNodeStructure[]): string [] {
  const checkedChildSection: string[] = [];

  for (const id of section.children.tocNodeIds) {
    const childSection = flatStructure.find(section => section.id === id);

    if (childSection?.state.isChecked) {
      checkedChildSection.push(childSection.id);
      checkedChildSection.push(...getCheckedChildSection(childSection, flatStructure));
    }
  }

  return checkedChildSection;
}

export function updateSanitization(
  section: FlatNodeStructure,
  flattenedNodeStructure: FlatNodeStructure[],
  isSanitized: boolean,
): void {
  section.state.isSanitized = isSanitized;

  for(const id of section.children.tocNodeIds) {
    const section = flattenedNodeStructure.find(section => section.id === id);
    updateSanitization(section, flattenedNodeStructure, isSanitized);
  }
}