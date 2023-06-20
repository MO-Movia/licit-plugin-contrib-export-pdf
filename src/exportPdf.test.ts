import {ExportPDFPlugin} from './ExportPDFPlugin';
import {ExportPDF} from './exportPdf';
import {doc, p, schema} from 'jest-prosemirror';
import {Schema} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';
import {EditorState} from 'prosemirror-state';

jest.mock('html2canvas', () => {
  return jest.fn().mockResolvedValue(null);
});

const mockPdfObject = {
  getNumberOfPages: jest.fn().mockReturnValue(5),
  internal: {
    pageSize: {
      width: 200,
      height: 300,
    },
  },
  setPage: jest.fn(),
  text: jest.fn(),
  save: jest.fn().mockReturnValue('2023-06-09_09:18:09.pdf'),
};

jest.mock('jspdf', () => {
  const mockSave = jest.fn();
  const mockHtml = jest.fn().mockImplementation((_data, options) => {
    options.callback(mockPdfObject);
  });

  const mockConstructor = jest.fn().mockImplementation(() => ({
    save: mockSave,
    html: mockHtml,
    text: jest.fn(),
  }));
  return mockConstructor;
});

describe('Export PDF', () => {
  let exportPdf;
  let plugin;
  beforeEach(() => {
    plugin = new ExportPDFPlugin(false);
    exportPdf = new ExportPDF();
  });

  it('should save the pdf if all required conditions satisfy', () => {
    const mySchema = new Schema({
      nodes: schema.spec.nodes,
      marks: schema.spec.marks,
    });
    const parent = document.createElement('div');
    parent.id = 'parant';
    const second = document.createElement('div');
    second.id = 'secondId';
    parent.appendChild(second);
    const third = document.createElement('div');
    third.id = 'thirdId';
    second.appendChild(third);
    const dom = document.createElement('div');
    dom.id = 'commentPlugin';
    third.appendChild(dom);
    const effSchema = plugin.getEffectiveSchema(mySchema);
    const state = EditorState.create({
      doc: doc('<p>', p('Hello World')),
      schema: effSchema,
    });
    const view = new EditorView(
      {mount: dom},
      {
        state: state,
      }
    );
    exportPdf.exportPdf(view);
    expect(mockPdfObject.save()).toEqual('2023-06-09_09:18:09.pdf');
  });

  it('should save the pdf with object Id', () => {
    const parent = document.createElement('div');
    parent.id = 'parant';
    const second = document.createElement('div');
    second.id = 'secondId';
    parent.appendChild(second);
    const third = document.createElement('div');
    third.id = 'thirdId';
    second.appendChild(third);
    const dom = document.createElement('div');
    dom.id = 'commentPlugin';
    third.appendChild(dom);
    mockPdfObject.save.mockReturnValue('0001-2365-4312-0567');
    const mockView = {
      dom: dom,
      state: {
        doc: {
          attrs: {
            objectId: '0001-2365-4312-0567',
          },
        },
      },
    } as unknown as EditorView;
    exportPdf.exportPdf(mockView);
    expect(mockPdfObject.save()).toEqual(mockView.state.doc.attrs.objectId);
  });
});
