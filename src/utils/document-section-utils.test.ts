import {
  buildListOfIdsToAdd,
  buildListOfIdsToRemove,
  buildSectionStructure,
  filterDocumentSections,
  flattenStructure,
  SectionNodeStructure,
  toggleAllSectionChildElements
} from './document-section-utils';
import { sampleStoredStyles } from '../test/document-styles';
import {
  sampleFlattenedStructure,
  sampleNodeList,
  sampleNodeListWithInvalidStyle,
  sampleNodeListWithoutContent,
  sampleNodeListWithoutTextContent,
  sampleSectionNodeStructure
} from '../test/document-nodes';

describe('document section utilities', () => {
  describe('buildSectionStructure', () => {
    it('should structure nodes by level', () => {
      const result = buildSectionStructure(sampleNodeList, sampleStoredStyles);
      expect(result).toEqual(sampleSectionNodeStructure);
    });

    it('should default to level 1 if node style does not exist', () => {
      const expectedStructure: SectionNodeStructure[] = [
        {
          id: '1',
          title: 'H1-1',
          style: 'someStyleThatShouldNOTExist',
          level: 1,
          isChecked: true,
          children: []
        }
      ];

      const result = buildSectionStructure(sampleNodeListWithInvalidStyle, sampleStoredStyles);
      expect(result).toEqual(expectedStructure);
    });

    it('should default title to empty string if "text" is not in content', () => {
      const expectedStructure: SectionNodeStructure[] = [
        {
          id: '1',
          title: '',
          style: 'H1',
          level: 1,
          isChecked: true,
          children: []
        }
      ];

      const result = buildSectionStructure(sampleNodeListWithoutTextContent, sampleStoredStyles);
      expect(result).toEqual(expectedStructure);
    });

    it('should default title to empty string if content is empty', () => {
      const expectedStructure: SectionNodeStructure[] = [
        {
          id: '1',
          title: '',
          style: 'H1',
          level: 1,
          isChecked: true,
          children: []
        }
      ];

      const result = buildSectionStructure(sampleNodeListWithoutContent, sampleStoredStyles);
      expect(result).toEqual(expectedStructure);
    });
  });

  describe('flattenStructure', () => {
    it('should flatten section node structure', () => {
      const result = flattenStructure(sampleSectionNodeStructure);
      expect(result).toEqual(sampleFlattenedStructure);
    });
  });

  describe('toggleAllSectionChildElements', () => {
    it('should toggle all child elements of section', () => {
      const documentSpy = jest.spyOn(document, 'getElementById').mockReturnValue({ disabled: false } as unknown as HTMLInputElement);
      toggleAllSectionChildElements(sampleFlattenedStructure, '2', true);

      expect(documentSpy).toHaveBeenCalled();
    });

    it('should not toggle if section has no children', () => {
      const documentSpy = jest.spyOn(document, 'getElementById').mockReturnValue({ disabled: false } as unknown as HTMLInputElement);
      toggleAllSectionChildElements(sampleFlattenedStructure, '3', false);

      expect(documentSpy).not.toHaveBeenCalled();
    });
  });

  describe('filterDocumentSections', () => {
    it('should filter document sections based on excluded IDs', () => {
      const mockDocument = document.createElement('div');
      const mockCollection = document.createDocumentFragment();
      const element1 = document.createElement('h1');
      element1.setAttribute('stylename', 'H1');
      const element2 = document.createElement('h2');
      element2.setAttribute('stylename', 'H2');
      const element3 = document.createElement('h3');
      element3.setAttribute('stylename', 'H3');
      const element4 = document.createElement('h2');
      element4.setAttribute('stylename', 'H2');
      const element5 = document.createElement('h1');
      element5.setAttribute('stylename', 'H1');
      mockCollection.appendChild(element1);
      mockCollection.appendChild(element2);
      mockCollection.appendChild(element3);
      mockCollection.appendChild(element4);
      mockCollection.appendChild(element5);

      const documentSpy = jest.spyOn(mockDocument, 'getElementsByClassName').mockReturnValue([mockCollection] as unknown as HTMLCollection);

      const sectionsToExclude = ['2', '5'];

      filterDocumentSections(
        mockDocument,
        sampleNodeList,
        sectionsToExclude,
        sampleStoredStyles
      );

      expect(documentSpy).toHaveBeenCalled();
      expect(mockCollection.childNodes.length).toEqual(3);
    });

    it('should return starting element if nothing to exclude', () => {
      const mockDocument = document.createElement('div');

      const result = filterDocumentSections(
        mockDocument,
        sampleNodeList,
        [],
        sampleStoredStyles
      );

      expect(result).toEqual(mockDocument);
    });

    it('should return starting element if element doesnt contain style from stored styles', () => {
      const mockDocument = document.createElement('div');
      const mockCollection = document.createDocumentFragment();
      const element1 = document.createElement('h1');
      element1.setAttribute('stylename', 'foobar');
      mockCollection.appendChild(element1);

      const documentSpy = jest.spyOn(mockDocument, 'getElementsByClassName').mockReturnValue([mockCollection] as unknown as HTMLCollection);

      const sectionsToExclude = ['2', '5'];

      const result = filterDocumentSections(
        mockDocument,
        sampleNodeList,
        sectionsToExclude,
        sampleStoredStyles
      );

      expect(documentSpy).toHaveBeenCalled();
      expect(result).toEqual(mockDocument);
    });

    it('should return starting element if IDs dont exist in document', () => {
      const mockDocument = document.createElement('div');
      const mockCollection = document.createDocumentFragment();
      const element1 = document.createElement('h1');
      element1.setAttribute('stylename', 'H1');
      mockCollection.appendChild(element1);

      const documentSpy = jest.spyOn(mockDocument, 'getElementsByClassName').mockReturnValue([mockCollection] as unknown as HTMLCollection);

      const sectionsToExclude = ['12'];

      const result = filterDocumentSections(
        mockDocument,
        sampleNodeList,
        sectionsToExclude,
        sampleStoredStyles
      );

      expect(documentSpy).toHaveBeenCalled();
      expect(result).toEqual(mockDocument);
    });

    it('should return starting element prosemirror editor does not contain any child elements', () => {
      const mockDocument = document.createElement('div');
      const mockCollection = document.createDocumentFragment();

      const documentSpy = jest.spyOn(mockDocument, 'getElementsByClassName').mockReturnValue([mockCollection] as unknown as HTMLCollection);

      const sectionsToExclude = ['1'];

      const result = filterDocumentSections(
        mockDocument,
        sampleNodeList,
        sectionsToExclude,
        sampleStoredStyles
      );

      expect(documentSpy).toHaveBeenCalled();
      expect(result).toEqual(mockDocument);
    });

    it('should return starting element if child element does not contain the stylename attribute', () => {
      const mockDocument = document.createElement('div');
      const mockCollection = document.createDocumentFragment();
      const element1 = document.createElement('h1');
      mockCollection.appendChild(element1);

      const documentSpy = jest.spyOn(mockDocument, 'getElementsByClassName').mockReturnValue([mockCollection] as unknown as HTMLCollection);

      const sectionsToExclude = ['1'];

      const result = filterDocumentSections(
        mockDocument,
        sampleNodeList,
        sectionsToExclude,
        sampleStoredStyles
      );

      expect(documentSpy).toHaveBeenCalled();
      expect(result).toEqual(mockDocument);
    });

    it('should remove next section if it does not contain a stylename', () => {
      const mockDocument = document.createElement('div');
      const mockCollection = document.createDocumentFragment();
      const element1 = document.createElement('h1');
      element1.setAttribute('stylename', 'H1');
      const element2 = document.createElement('h2');
      element2.setAttribute('stylename', 'H2');
      const element3 = document.createElement('h3');
      const element4 = document.createElement('h2');
      element4.setAttribute('stylename', 'H2');
      const element5 = document.createElement('h1');
      element5.setAttribute('stylename', 'H1');
      const element6 = document.createElement('h1');
      mockCollection.appendChild(element1);
      mockCollection.appendChild(element2);
      mockCollection.appendChild(element3);
      mockCollection.appendChild(element4);
      mockCollection.appendChild(element5);
      mockCollection.appendChild(element6);

      const documentSpy = jest.spyOn(mockDocument, 'getElementsByClassName').mockReturnValue([mockCollection] as unknown as HTMLCollection);

      const sectionsToExclude = ['2', '5'];

      filterDocumentSections(
        mockDocument,
        sampleNodeList,
        sectionsToExclude,
        sampleStoredStyles
      );

      expect(documentSpy).toHaveBeenCalled();
      expect(mockCollection.childNodes.length).toEqual(2);
    });
  });

  describe('buildListOfIdsToAdd', () => {
    it('should build list of IDs to re-add to the document including nested sections', () => {
      const result = buildListOfIdsToAdd('1', ['1', '2', '3'], sampleFlattenedStructure);
      expect(result).toEqual([]);
    });

    it('should re-add sections leaving the unrelated', () => {
      const result = buildListOfIdsToAdd('3', ['1', '5'], sampleFlattenedStructure);
      expect(result).toEqual(['5']);
    });
  });

  describe('buildListOfIdsToRemove', () => {
    it('should build list of IDs to remove from the document including nested sections', () => {
      const result = buildListOfIdsToRemove('1', [], sampleFlattenedStructure);
      expect(result).toEqual(['1', '2', '3', '4']);
    });
  });
});