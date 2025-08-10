import { DocumentStyle, StoredStyle } from '../utils/table-of-contents-utils';

export const sampleDocumentStyles: DocumentStyle[] = [
  {
    description: 'style1 description',
    isHidden: false,
    mode: 0,
    otherStyleSelected: false,
    styleName: 'H1 Style',
    styles: {
      align: 'left',
      boldNumbering: false,
      boldPartial: false,
      boldSentence: true,
      fontName: 'Arial',
      fontSize: '30',
      isHidden: false,
      nextLineStyleName: false,
      styleLevel: '1',
      toc: true,
    },
    toc: false
  },
  {
    description: 'style2 description',
    isHidden: false,
    mode: 0,
    otherStyleSelected: false,
    styleName: 'H2 Style',
    styles: {
      align: 'left',
      boldNumbering: false,
      boldPartial: false,
      boldSentence: true,
      fontName: 'Arial',
      fontSize: '30',
      isHidden: false,
      nextLineStyleName: false,
      styleLevel: '2',
      toc: false,
    },
    toc: false
  },
  {
    description: 'style3 description',
    isHidden: false,
    mode: 0,
    otherStyleSelected: false,
    styleName: 'H3 Style',
    toc: false
  }
];

export const sampleStoredStyle: StoredStyle[] = [
  {
    name: 'H3',
    level: 3,
  }
];

export const sampleStoredStyles: StoredStyle[] = [
  {
    name: 'H1',
    level: 1,
  },
  {
    name: 'H2',
    level: 2,
  },
  {
    name: 'H3',
    level: 3,
  }
];