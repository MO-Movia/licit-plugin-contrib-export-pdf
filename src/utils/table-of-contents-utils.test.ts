import { getTableStyles, StoredStyle } from './table-of-contents-utils';
import { sampleDocumentStyles } from '../test-data/document-styles.test';

describe('table of contents utilities', () => {
  describe('getTableOfContentStyles', () => {
    it('should return style strucutre from document styles', () => {
      const expectedStructure: StoredStyle[] = [
        
      ];

      const results = getTableStyles(sampleDocumentStyles,'tot');
      expect(results).toEqual(expectedStructure);
    });
  });
});