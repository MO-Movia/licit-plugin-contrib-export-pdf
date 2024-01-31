import {ExportPDF} from './exportPdf';
import {EditorView} from 'prosemirror-view';

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
  let exportPdf: ExportPDF;
  beforeEach(() => {
    exportPdf = new ExportPDF();
  });

  it('should save the pdf with timestamp if objectId is null', () => {
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

    const mockView = {
      dom: dom,
      state: {
        doc: {
          attrs: {
            objectId: null,
          },
        },
      },
    } as unknown as EditorView;
    const result = exportPdf.exportPdf(mockView);

    expect(result).toBe(true);
    expect(mockPdfObject.save).toBeDefined();
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

  it('should return view.dom if plugin is enabled', () => {
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

    const pluginContainer = document.createElement('div');
    pluginContainer.id = 'commentPlugin';
    dom.appendChild(pluginContainer);

    const mockView = {
      dom: dom,
      state: {
        doc: {
          attrs: {
            objectId: 'exampleObjectId',
          },
        },
      },
    } as unknown as EditorView;

    const result = exportPdf.exportPdf(mockView);

    expect(result).toBe(true);
    expect(exportPdf.getContainer(mockView)).toBeDefined();
  });
});
