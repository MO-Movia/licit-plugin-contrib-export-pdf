import { getTableOfContentStyles, StoredStyle } from './table-of-contents-utils';
import { sampleDocumentStyles } from '../test-data/document-styles.test';

describe('table of contents utilities', () => {
  describe('getTableOfContentStyles', () => {
    it('should return style strucutre from document styles', () => {
      const expectedStructure: StoredStyle[] = [
        {
          name: sampleDocumentStyles[0].styleName,
          level: sampleDocumentStyles[0].styles!.styleLevel,
        }
      ];

      const results = getTableOfContentStyles(sampleDocumentStyles);
      expect(results).toEqual(expectedStructure);
    });
  });
});