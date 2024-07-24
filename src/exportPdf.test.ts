import {createToc, ExportPDF} from './exportPdf';
import {EditorView} from 'prosemirror-view';
import {PreviewForm} from './preview';
import * as prevF from './preview';

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
describe('createToc', () => {
  const config = {
    content: document.createElement('div'),
    tocElement: 'div',
    titleElements: ['h1', 'h2', 'h3'],
  };
  it('should add classes, data attributes, and ids to title elements', () => {
    const title1 = document.createElement('p');
    title1.setAttribute('stylename', 'h1');
    config.content.appendChild(title1);

    const title2 = document.createElement('p');
    title2.setAttribute('stylename', 'h2');
    config.content.appendChild(title2);

    const title3 = document.createElement('p');
    title3.setAttribute('stylename', 'h3');
    config.content.appendChild(title3);

    const tocElementDiv = document.createElement('div');
    config.content.appendChild(tocElementDiv);

    createToc(config);

    expect(title1.classList.contains('title-element')).toBeTruthy();
    expect(title1.getAttribute('data-title-level')).toBe('1');
    expect(title1.id).toBe('title-element-1');

    expect(title2.classList.contains('title-element')).toBeTruthy();
    expect(title2.getAttribute('data-title-level')).toBe('2');
    expect(title2.id).toBe('title-element-2');

    expect(title3.classList.contains('title-element')).toBeTruthy();
    expect(title3.getAttribute('data-title-level')).toBe('3');
    expect(title3.id).toBe('title-element-3');
  });
  it('should handle exportPdf', () => {
    jest
      .spyOn(prevF, 'PreviewForm')
      .mockReturnValue([] as unknown as PreviewForm);

    const exppdf = new ExportPDF();
    const mockEditorView = {
      dom: {parentElement: document.createElement('div')},
    } as unknown as EditorView;
    expect(exppdf.exportPdf(mockEditorView)).toBeTruthy();
  });
});
