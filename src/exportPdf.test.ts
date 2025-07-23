// exportPDF.test.ts
import { createTable } from './exportPdf';
import { createPopUp } from '@modusoperandi/licit-ui-commands';

// Mock createPopUp
jest.mock('@modusoperandi/licit-ui-commands', () => ({
  createPopUp: jest.fn(),
}));

describe('ExportPDF', () => {
  let mockPopUp: unknown;

  beforeEach(() => {

    // Mock PopUp
    mockPopUp = {
      close: jest.fn(),
    };
    (createPopUp as jest.Mock).mockReturnValue(mockPopUp);
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.classList.remove('export-pdf-mode');
  });


  describe('createToc', () => {
    let content: HTMLElement;

    beforeEach(() => {
      document.body.innerHTML = '';

      content = document.createElement('div');
      document.body.appendChild(content);

      const tocContainer = document.createElement('div');
      tocContainer.className = 'toc-container';
      content.appendChild(tocContainer);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should create TOC when no existing TOC', () => {
      global.CSS = global.CSS || {};
      global.CSS.escape = jest.fn((str) => `escaped(${str})`);
      const p1 = document.createElement('p');
      p1.setAttribute('stylename', 'Heading1');
      p1.textContent = 'Title One';
      content.appendChild(p1);

      const h4 = document.createElement('h4');
      h4.setAttribute('stylename', 'Heading2');
      h4.textContent = 'Title Two';
      content.appendChild(h4);

      createTable({
        content,
        tocElement: '.toc-container',
        titleElements: ['Heading1', 'Heading2'],
      });

      const generatedToc = content.querySelector('#list-toc-generated');
      expect(generatedToc).toBeTruthy();
      expect(generatedToc?.querySelectorAll('p').length).toBe(2);

      const titleElements = content.querySelectorAll('.title-element');
      expect(titleElements.length).toBe(2);

      titleElements.forEach((el) => {
        expect(el.classList.contains('title-element')).toBe(true);
        expect(el.hasAttribute('data-title-level')).toBe(true);
        expect(el.id).toContain('title-element-');
      });

      const tocElements = generatedToc?.querySelectorAll('.toc-element');
      expect(tocElements?.length).toBe(2);

      tocElements?.forEach((el) => {
        expect(el.querySelector('a')).toBeTruthy();
        const link = el.querySelector('a')!;
        expect(link.getAttribute('href')).toContain('title-element-');
      });
    });

    it('should not create TOC if #list-toc-generated exists', () => {
      global.CSS = global.CSS || {};
      global.CSS.escape = jest.fn((str) => `escaped(${str})`);
      const existingToc = document.createElement('div');
      existingToc.id = 'list-toc-generated';
      content.querySelector('.toc-container')?.appendChild(existingToc);

      const appendChildSpy = jest.spyOn(existingToc.parentElement!, 'appendChild');

      createTable({
        content,
        tocElement: '.toc-container',
        titleElements: ['Heading1'],
      });

      expect(appendChildSpy).not.toHaveBeenCalledWith(expect.any(HTMLDivElement));
    });

    it('should truncate long text in TOC', () => {
      global.CSS = global.CSS || {};
      global.CSS.escape = jest.fn((str) => `escaped(${str})`);
      const p = document.createElement('p');
      p.setAttribute('stylename', 'Heading1');
      p.textContent = 'A very very very very very very very very very very very very very very very long title that exceeds 70 characters';
      content.appendChild(p);

      createTable({
        content,
        tocElement: '.toc-container',
        titleElements: ['Heading1'],
      });

      const tocLink = content.querySelector('#list-toc-generated p a');
      expect(tocLink?.textContent?.length).toBeLessThanOrEqual(70);
    });
  });
});
