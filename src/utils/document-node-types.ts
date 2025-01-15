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

export const classificaitonToNumericLevelMap = new Map<string, number>([
  ['U', 0],
  ['CUI', 1],
  ['C', 2],
  ['S', 3],
  ['TS', 4],
]);

export type SanitizedNodes = {
  tocNodes: string[],
  normalNodes: string[],
}

export type NodeStructure = {
  children: {
    normalNodes: NodeStructure[];
    tocNodes: NodeStructure[];
  }
} & BaseNodeStructure;

export type FlatNodeStructure = {
  children: {
    normalNodeIds: string[];
    tocNodeIds: string[];
  }
} & BaseNodeStructure;

export type NodeContent = Fragment & { content: { text: string }[] }
