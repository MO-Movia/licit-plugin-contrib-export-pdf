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
});
