// exportPDF.test.ts
import { createTable, ExportPDF } from './exportPdf';
import { createPopUp } from '@modusoperandi/licit-ui-commands';
import { Schema } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { schema as basicSchema } from 'prosemirror-schema-basic';
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
      globalThis.CSS ??= {} as unknown as typeof CSS;
      globalThis.CSS.escape = jest.fn((str) => `escaped(${str})`);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should create TOC when no existing TOC', () => {

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
  it('should handle exportPdf', () => {
    const schema = new Schema({
      nodes: basicSchema.spec.nodes,
      marks: basicSchema.spec.marks,
    });

    // Create a simple document node (you can extend this)
    const content = schema.node('doc', null, [
      schema.node('paragraph', null, [
        schema.text('This is a test paragraph in the mock ProseMirror view.')
      ])
    ]);

    // Create a mock state
    const state = EditorState.create({
      doc: content,
      schema,
    });

    // Create a DOM container for the editor
    const editorContainer = document.createElement('div');
    document.body.appendChild(editorContainer);

    // Create a mock EditorView
    const editorView = new EditorView(editorContainer, {
      state,
    });
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Hello, this is a test document!',
            },
          ],
        },
      ],
    };

    const expdf = new ExportPDF();
    expect(expdf.exportPdf(editorView,doc)).toBeDefined();
    expect(expdf.exportPdf(editorView,doc)).toBeDefined();
  });
});
