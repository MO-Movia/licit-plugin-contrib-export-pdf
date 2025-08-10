import { Node } from 'prosemirror-model';
import { FlatSectionNodeStructure, SectionNodeStructure } from '../utils/document-section-utils';

export const sampleNodeList = [
  {
    attrs: {
      styleName: 'H1',
      objectId: '1',
    },
    content: {
      content: [{
        text: 'H1-1'
      }]
    }
  },
  {
    attrs: {
      styleName: 'H2',
      objectId: '2',
    },
    content: {
      content: [{
        text: 'H2-1'
      }]
    }
  },
  {
    attrs: {
      styleName: 'H3',
      objectId: '3',
    },
    content: {
      content: [{
        text: 'H3-1'
      }]
    }
  },
  {
    attrs: {
      styleName: 'H2',
      objectId: '4',
    },
    content: {
      content: [{
        text: 'H2-2'
      }]
    }
  },
  {
    attrs: {
      styleName: 'H1',
      objectId: '5',
    },
    content: {
      content: [{
        text: 'H1-2'
      }]
    }
  },
] as unknown as Node[];

export const sampleSectionNodeStructure: SectionNodeStructure[] = [
  {
    id: '1',
    title: 'H1-1',
    style: 'H1',
    level: 1,
    isChecked: true,
    children: [
      {
        id: '2',
        title: 'H2-1',
        style: 'H2',
        level: 2,
        isChecked: true,
        children: [
          {
            id: '3',
            title: 'H3-1',
            style: 'H3',
            level: 3,
            isChecked: true,
            children: []
          },
        ]
      },
      {
        id: '4',
        title: 'H2-2',
        style: 'H2',
        level: 2,
        isChecked: true,
        children: []
      },
    ]
  },
  {
    id: '5',
    title: 'H1-2',
    style: 'H1',
    level: 1,
    isChecked: true,
    children: []
  }
];

export const sampleFlattenedStructure: FlatSectionNodeStructure[] = [
  {
    id: '1',
    title: 'H1-1',
    style: 'H1',
    level: 1,
    isChecked: true,
    childrenIds: ['2', '4']
  },
  {
    id: '2',
    title: 'H2-1',
    style: 'H2',
    level: 2,
    isChecked: true,
    childrenIds: ['3']
  },
  {
    id: '3',
    title: 'H3-1',
    style: 'H3',
    level: 3,
    isChecked: true,
    childrenIds: []
  },
  {
    id: '4',
    title: 'H2-2',
    style: 'H2',
    level: 2,
    isChecked: true,
    childrenIds: []
  },
  {
    id: '5',
    title: 'H1-2',
    style: 'H1',
    level: 1,
    isChecked: true,
    childrenIds: []
  }
];

export const sampleNodeListWithInvalidStyle = [
  {
    attrs: {
      styleName: 'someStyleThatShouldNOTExist',
      objectId: '1',
    },
    content: {
      content: [{
        text: 'H1-1'
      }]
    }
  }
] as unknown as Node[];

export const sampleNodeListWithoutTextContent = [
  {
    attrs: {
      styleName: 'H1',
      objectId: '1',
    },
    content: {
      content: [{
        description: 'foobar'
      }]
    }
  }
] as unknown as Node[];

export const sampleNodeListWithoutContent = [
  {
    attrs: {
      styleName: 'H1',
      objectId: '1',
    },
    content: {}
  }
] as unknown as Node[];