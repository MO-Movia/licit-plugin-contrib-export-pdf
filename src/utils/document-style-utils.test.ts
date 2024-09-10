import { getStyleLevel } from './document-style-utils';
import { StoredStyle } from './table-of-contents-utils';
import { sampleStoredStyle } from '../test-data/document-styles.test';

describe('document style utilities', () => {
  describe('getStyleLevel', () => {
    it('should return level of style', () => {
      const results = getStyleLevel('H3', sampleStoredStyle);
      expect(results).toEqual(3);
    });

    it('should return level of 1 if style level is NaN', () => {
      const mockStoredStyles: StoredStyle[] = [...sampleStoredStyle];
      mockStoredStyles[0].level = 'foobar';

      const results = getStyleLevel('H3', mockStoredStyles);
      expect(results).toEqual(1);
    });

    it('should return null if no style level is present', () => {
      const mockStoredStyles: StoredStyle[] = [];

      const results = getStyleLevel('H3', mockStoredStyles);
      expect(results).toEqual(null);
    });
  });
});