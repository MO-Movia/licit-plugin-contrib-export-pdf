import { Fragment } from 'prosemirror-model';

type NodeCapco = {
  finalmarking: string;
  ism: {
    atomicEnergyMarkings: string[];
    classification: string[];
    disseminationControls: string[];
    fgiSourceOpen: string[];
    nonICmarkings: string[];
    ownerProducer: string[];
    releasableTo: string[];
    sarIdentifiers: string[];
    sciControls: string[];
    version: string;
  }
}

type BaseNodeStructure = {
  capco: NodeCapco;
  id: string;
  level: number | null;
  state: {
    isChecked: boolean;
    isDisabled: boolean;
    isSanitized: boolean;
    isSectionTitle: boolean;
  },
  style: string;
  title: string;
}

export type SectionNodeStructure = {
  childSections: SectionNodeStructure[];
  childNodes: SectionNodeStructure[];
} & BaseNodeStructure;

export type FlatSectionNodeStructure = {
  childSectionIds: string[];
  childNodeIds: string[];
} & BaseNodeStructure;

export type NodeContent = Fragment & { content: { text: string }[] }
