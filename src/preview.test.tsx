import { PreviewForm } from './preview';
import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import * as tcUtils from './utils/table-of-contents-utils';
import { StoredStyle } from './utils/table-of-contents-utils';

describe('PreviewForm', () => {

  it('should call calcLogic when PreviewForm.isToc = true ', () => {
    const dommock = document.createElement('div');
    const parentelement = document.createElement('div');
    parentelement.appendChild(dommock);
    const parparentElement = document.createElement('div');
    const prosimer_cls_element = document.createElement('div');
    prosimer_cls_element.className = 'ProseMirror';
    parparentElement.appendChild(parentelement);
    parparentElement.appendChild(prosimer_cls_element);

    jest
      .spyOn(document, 'getElementById')
      .mockReturnValue(document.createElement('div'));
    const props = {
      editorState: { doc: { attrs: { gg: null } } } as unknown as EditorState,
      editorView: { dom: dommock, dispatch: () => { }, state: { tr: { setMeta: () => { return {}; } } } } as unknown as EditorView,
      onClose: () => { },
    };
    const prevForm = new PreviewForm(props);
    PreviewForm['isToc'] = true;
    expect(prevForm.calcLogic()).toBeUndefined();
  });

  it('should call calcLogic when PreviewForm.isTitle = true ', () => {
    const dommock = document.createElement('div');
    const parentelement = document.createElement('div');
    parentelement.appendChild(dommock);
    const parparentElement = document.createElement('div');
    const prosimer_cls_element = document.createElement('div');
    prosimer_cls_element.className = 'ProseMirror';
    parparentElement.appendChild(parentelement);
    parparentElement.appendChild(prosimer_cls_element);

    jest
      .spyOn(document, 'getElementById')
      .mockReturnValue(document.createElement('div'));
    const props = {
      editorState: { doc: { attrs: { gg: null } } } as unknown as EditorState,
      editorView: {
        dom: dommock,
        state: { doc: { attrs: { gg: null } } },
        dispatch: () => { }
      } as unknown as EditorView,
      onClose: () => { },
    };
    const prevForm = new PreviewForm(props);

    PreviewForm['isTitle'] = true;
    expect(prevForm.calcLogic()).toBeUndefined();
  });

  it('should call calcLogic when PreviewForm.isTitle = true and  PreviewForm.isToc = false', () => {
    const dommock = document.createElement('div');
    const parentelement = document.createElement('div');
    parentelement.appendChild(dommock);
    const parparentElement = document.createElement('div');
    const prosimer_cls_element = document.createElement('div');
    prosimer_cls_element.className = 'ProseMirror';
    parparentElement.appendChild(parentelement);
    parparentElement.appendChild(prosimer_cls_element);

    jest
      .spyOn(document, 'getElementById')
      .mockReturnValue(document.createElement('div'));
    const props = {
      editorState: { doc: { attrs: { gg: null } } } as unknown as EditorState,
      editorView: {
        dom: dommock,
        state: { doc: { attrs: { gg: null } } },
        dispatch: () => { }
      } as unknown as EditorView,
      onClose: () => { },
    };
    const prevForm = new PreviewForm(props);
    jest.spyOn(prevForm, 'insertFooters').mockImplementation(() => { });

    PreviewForm['isToc'] = false;
    PreviewForm['isTitle'] = true;
    PreviewForm['isCitation'] = true;

    expect(prevForm.calcLogic()).toBeUndefined();
  });
});

describe('PreviewForm component', () => {
  let onCloseMock: jest.Mock;
  let printWindowMock: any;

  beforeEach(() => {
    onCloseMock = jest.fn();
    printWindowMock = {
      document: {
        open: jest.fn(),
        writeln: jest.fn(),
        close: jest.fn(),
        createElement: jest.fn(),
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        documentElement: document.createElement('div'),
      },
      print: jest.fn(),
    };
    window.open = jest.fn(() => printWindowMock);
    document.getElementById = jest.fn().mockReturnValue({
      childNodes: [document.createElement('div')],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle AFTTP document and extract CUI data in componentDidMount', () => {
    const dommock = document.createElement('div');
    const parentelement = document.createElement('div');
    parentelement.appendChild(dommock);
    const parparentElement = document.createElement('div');
    const prosimer_cls_element = document.createElement('div');
    prosimer_cls_element.className = 'ProseMirror';
    parparentElement.appendChild(parentelement);
    parparentElement.appendChild(prosimer_cls_element);
    
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'tableWrapper';
    const table = document.createElement('table');
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    const styledSpan = document.createElement('span');
    styledSpan.setAttribute('style', 'color: rgb(255, 0, 0);');
    styledSpan.textContent = 'CUI//SP-CTI';
    cell.appendChild(styledSpan);
    row.appendChild(cell);
    table.appendChild(row);
    tableWrapper.appendChild(table);
    parparentElement.appendChild(tableWrapper);

    jest.spyOn(document, 'getElementById').mockReturnValue(document.createElement('div'));

    const props = {
      editorState: { doc: { attrs: { gg: null } } } as unknown as EditorState,
      editorView: {
        dom: dommock,
        state: { 
          doc: { attrs: { gg: null } },
          tr: { setMeta: jest.fn().mockReturnThis() }
        },
        dispatch: jest.fn()
      } as unknown as EditorView,
      onClose: onCloseMock,
    };

    const previewForm = new PreviewForm(props);
    jest.spyOn(previewForm, 'isAfttpDoc').mockReturnValue(true);
    jest.spyOn(previewForm, 'getDocumentTitle').mockReturnValue('Test Document');
    jest.spyOn(previewForm, 'getToc').mockResolvedValue();
    jest.spyOn(previewForm, 'showAlert').mockImplementation(() => {});
    jest.spyOn(previewForm, 'insertSectionHeaders').mockImplementation(() => {});
    jest.spyOn(previewForm, 'replaceInfoIcons').mockImplementation(() => {});
    jest.spyOn(previewForm, 'updateImageWidths').mockImplementation(() => {});
    jest.spyOn(previewForm, 'prepareEditorContent').mockImplementation(() => {});
    jest.spyOn(previewForm, 'updateTableWidths').mockImplementation(() => {});

    previewForm.componentDidMount();

    expect(PreviewForm['documentTitle']).toBe('Test Document');
    expect(PreviewForm['pageBanner']).toEqual({
      color: 'rgb(255, 0, 0)',
      text: 'CUI//SP-CTI',
    });
    expect(PreviewForm['isAfttp']).toBeUndefined();
  });

  it('should reset AFTTP properties when document is not AFTTP in componentDidMount', () => {
    const dommock = document.createElement('div');
    const parentelement = document.createElement('div');
    parentelement.appendChild(dommock);
    const parparentElement = document.createElement('div');
    const prosimer_cls_element = document.createElement('div');
    prosimer_cls_element.className = 'ProseMirror';
    parparentElement.appendChild(parentelement);
    parparentElement.appendChild(prosimer_cls_element);

    jest.spyOn(document, 'getElementById').mockReturnValue(document.createElement('div'));

    const props = {
      editorState: { doc: { attrs: { gg: null } } } as unknown as EditorState,
      editorView: {
        dom: dommock,
        state: { 
          doc: { attrs: { gg: null } },
          tr: { setMeta: jest.fn().mockReturnThis() }
        },
        dispatch: jest.fn()
      } as unknown as EditorView,
      onClose: onCloseMock,
    };

    const previewForm = new PreviewForm(props);
    jest.spyOn(previewForm, 'isAfttpDoc').mockReturnValue(false);
    jest.spyOn(previewForm, 'getToc').mockResolvedValue();
    jest.spyOn(previewForm, 'showAlert').mockImplementation(() => {});
    jest.spyOn(previewForm, 'insertSectionHeaders').mockImplementation(() => {});
    jest.spyOn(previewForm, 'replaceInfoIcons').mockImplementation(() => {});
    jest.spyOn(previewForm, 'updateImageWidths').mockImplementation(() => {});
    jest.spyOn(previewForm, 'prepareEditorContent').mockImplementation(() => {});
    jest.spyOn(previewForm, 'updateTableWidths').mockImplementation(() => {});

    previewForm.componentDidMount();

    expect(PreviewForm['documentTitle']).toBeNull();
    expect(PreviewForm['pageBanner']).toBeNull();
    expect(PreviewForm['isAfttp']).toBeUndefined();
  });

  it('should return null when tableWrapper is not found in extractBannerMarkingFromTableWrapper', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: onCloseMock,
    };

    const previewForm = new PreviewForm(props);
    const root = document.createElement('div');

    const result = previewForm.extractBannerMarkingFromTableWrapper(root);

    expect(result).toBeNull();
  });

  it('should return null when first row is not found in extractBannerMarkingFromTableWrapper', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: onCloseMock,
    };

    const previewForm = new PreviewForm(props);
    const root = document.createElement('div');
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'tableWrapper';
    const table = document.createElement('table');
    tableWrapper.appendChild(table);
    root.appendChild(tableWrapper);

    const result = previewForm.extractBannerMarkingFromTableWrapper(root);

    expect(result).toBeNull();
  });

  it('should return null when no styled elements are found in extractBannerMarkingFromTableWrapper', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: onCloseMock,
    };

    const previewForm = new PreviewForm(props);
    const root = document.createElement('div');
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'tableWrapper';
    const table = document.createElement('table');
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.textContent = 'No color';
    row.appendChild(cell);
    table.appendChild(row);
    tableWrapper.appendChild(table);
    root.appendChild(tableWrapper);

    const result = previewForm.extractBannerMarkingFromTableWrapper(root);

    expect(result).toBeNull();
  });

  it('should return null when color match is not found in extractBannerMarkingFromTableWrapper', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: onCloseMock,
    };

    const previewForm = new PreviewForm(props);
    const root = document.createElement('div');
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'tableWrapper';
    const table = document.createElement('table');
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    const styledSpan = document.createElement('span');
    styledSpan.setAttribute('style', 'font-weight: bold;');
    styledSpan.textContent = 'No color attribute';
    cell.appendChild(styledSpan);
    row.appendChild(cell);
    table.appendChild(row);
    tableWrapper.appendChild(table);
    root.appendChild(tableWrapper);

    const result = previewForm.extractBannerMarkingFromTableWrapper(root);

    expect(result).toBeNull();
  });

  it('should extract CUI data with text and color from styled element in extractBannerMarkingFromTableWrapper', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: onCloseMock,
    };

    const previewForm = new PreviewForm(props);
    const root = document.createElement('div');
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'tableWrapper';
    const table = document.createElement('table');
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    const styledSpan = document.createElement('span');
    styledSpan.setAttribute('style', 'color: rgb(255, 0, 0); font-weight: bold;');
    styledSpan.textContent = '  CUI//SP-CTI  ';
    cell.appendChild(styledSpan);
    row.appendChild(cell);
    table.appendChild(row);
    tableWrapper.appendChild(table);
    root.appendChild(tableWrapper);

    const result = previewForm.extractBannerMarkingFromTableWrapper(root);

    expect(result).toEqual({
      text: 'CUI//SP-CTI',
      color: 'rgb(255, 0, 0)'
    });
  });

  it('should pick the deepest styled element when multiple color elements exist in extractBannerMarkingFromTableWrapper', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: onCloseMock,
    };

    const previewForm = new PreviewForm(props);
    const root = document.createElement('div');
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'tableWrapper';
    const table = document.createElement('table');
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    
    const outerSpan = document.createElement('span');
    outerSpan.setAttribute('style', 'color: blue;');
    outerSpan.textContent = 'Outer';
    
    const innerSpan = document.createElement('span');
    innerSpan.setAttribute('style', 'color: red;');
    innerSpan.textContent = 'Inner CUI';
    
    outerSpan.appendChild(innerSpan);
    cell.appendChild(outerSpan);
    row.appendChild(cell);
    table.appendChild(row);
    tableWrapper.appendChild(table);
    root.appendChild(tableWrapper);

    const result = previewForm.extractBannerMarkingFromTableWrapper(root);

    expect(result).toEqual({
      text: 'Inner CUI',
      color: 'red'
    });
  });

  it('should return document title from editorView in getDocumentTitle', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: onCloseMock,
    };

    const previewForm = new PreviewForm(props);
    
    const mockEditorView = {
      state: {
        doc: {
          attrs: {
            objectMetaData: {
              name: 'Test Document Title'
            }
          }
        }
      }
    };

    const result = previewForm.getDocumentTitle(mockEditorView);

    expect(result).toBe('Test Document Title');
  });

  it('should return empty string when objectMetaData.name is undefined in getDocumentTitle', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: onCloseMock,
    };

    const previewForm = new PreviewForm(props);
    
    const mockEditorView = {
      state: {
        doc: {
          attrs: {
            objectMetaData: {}
          }
        }
      }
    };

    const result = previewForm.getDocumentTitle(mockEditorView);

    expect(result).toBe('');
  });

  it('should return empty string when objectMetaData is undefined in getDocumentTitle', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: onCloseMock,
    };

    const previewForm = new PreviewForm(props);
    
    const mockEditorView = {
      state: {
        doc: {
          attrs: {}
        }
      }
    };

    const result = previewForm.getDocumentTitle(mockEditorView);

    expect(result).toBe('');
  });

  it('should return empty string when editorView is null in getDocumentTitle', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: onCloseMock,
    };

    const previewForm = new PreviewForm(props);

    const result = previewForm.getDocumentTitle(null);

    expect(result).toBe('');
  });

  it('should return empty string when editorView is undefined in getDocumentTitle', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: onCloseMock,
    };

    const previewForm = new PreviewForm(props);

    const result = previewForm.getDocumentTitle(undefined);

    expect(result).toBe('');
  });
  it('should call handleConfirm', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: onCloseMock,
    };

    const previewForm = new PreviewForm(props);
    jest.spyOn(previewForm, 'prepareCSSRules').mockImplementation(() => { });
    previewForm.handleConfirm();
    expect(window.open).toHaveBeenCalledWith('', '_blank');
    expect(printWindowMock.document.open).toHaveBeenCalled();
    expect(printWindowMock.document.writeln).toHaveBeenCalledWith(
      expect.stringContaining(
        '<!DOCTYPE html>'
      )
    );
    expect(printWindowMock.document.documentElement.firstChild).not.toBeNull();
    expect(printWindowMock.document.documentElement.appendChild).not.toBeNull();
    expect(printWindowMock.document.close).toHaveBeenCalled();
    expect(printWindowMock.print).toHaveBeenCalled();
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('should handle handelCitation  ', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: onCloseMock,
    };

    const previewForm = new PreviewForm(props);
    const spy = jest
      .spyOn(previewForm, 'calcLogic')
      .mockImplementation(() => { });
    previewForm.handelCitation({ target: { checked: true } });
    expect(spy).toBeDefined();
  });

  it('should handle handelCitation when checked is false', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: onCloseMock,
    };

    const previewForm = new PreviewForm(props);
    const spy = jest
      .spyOn(previewForm, 'calcLogic')
      .mockImplementation(() => { });
    previewForm.handelCitation({ target: { checked: false } });
    expect(spy).toBeDefined();
  });


  it('should call the function handleCancel()', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose() {
        return 'close';
      },
    };
    const Previewform = new PreviewForm(props);
    expect(Previewform.handleCancel()).toBeUndefined();
  });

  it('should handle insertFooters  ', () => {
    const spy = jest.spyOn(document, 'createTextNode');
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose() {
        return 'close';
      },
    };
    const Previewform = new PreviewForm(props);
    const el = document.createElement('div');
    el.setAttribute('overallcitationcapco', 'TBD');
    el.setAttribute('author', 'AUT');
    Previewform.insertFooters([el], {
      querySelector: () => {
        return document.createElement('div');
      },
    });
    expect(spy).toHaveBeenCalled();
  });

  it('should call prepareCSSRules ', () => {
    const doc = {
      head: document.createElement('div'),
      createElement: () => {
        return document.createElement('div');
      },
    };

    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose() {
        return 'close';
      },
    };
    const Previewform = new PreviewForm(props);
    Previewform.prepareCSSRules(doc);
  });

  it('should handel render', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose() {
        return 'close';
      },
    };
    const Previewform = new PreviewForm(props);
    expect(Previewform.render()).toBeDefined();
  });

  it('should call the function componentDidMount() when !data || !divContainer', () => {
    const el = document.createElement('div');
    const prosimer_cls_element = document.createElement('div');
    prosimer_cls_element.className = 'ProseMirror';
    el.appendChild(prosimer_cls_element);
    jest.spyOn(document, 'getElementById').mockReturnValue(null);

    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {
        dom: { parentElement: { parentElement: el } },
        dispatch: () => { }
      } as unknown as EditorView,
      onClose() {
        return;
      },
    };
    const Previewform = new PreviewForm(props);
    const spy = jest.spyOn(Previewform, 'getToc').mockReturnValue(null as unknown as Promise<void>);
    Previewform.componentDidMount();
    expect(spy).toHaveBeenCalled();
  });

  it('should call the getToc() function ', async () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose() {
        return;
      },
    };
    const view = {
      runtime: {
        getStylesAsync: () => {
          return new Promise((resolve) => {
            const mockStyles = [
              { styles: { toc: true }, name: 'style1' },
              { styles: { toc: true }, name: 'style2' },
            ];
            resolve(mockStyles);
          });
        },
      },
    };
    const Previewform = new PreviewForm(props);
    expect(Previewform.getToc(view)).toBeDefined();
  });

  it('shouldcall the replaceImageWidth() function to pass originalWidth > 200 condtion', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose() {
        return;
      },
    };
    const Previewform = new PreviewForm(props);
    const imageElement = document.createElement('img');
    imageElement.setAttribute('width', '700');

    Previewform.replaceImageWidth(imageElement);
    expect(imageElement.getAttribute('data-original-width')).toBe(null);
  });

  it('should rotate image and adjust styles in replaceImageWidth when width > 620 and figure/title exist', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: jest.fn(),
    };
    const previewForm = new PreviewForm(props);

    const figureTitle = document.createElement('div');
    figureTitle.setAttribute('stylename', 'attFigureTitle');

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('enhanced-table-figure-content');

    const figure = document.createElement('div');
    figure.classList.add('enhanced-table-figure');
    figure.appendChild(contentDiv);
    figure.parentElement?.appendChild?.(figureTitle);
    document.body.appendChild(figureTitle);
    document.body.appendChild(figure);

    figureTitle.insertAdjacentElement('afterend', figure);

    const image = document.createElement('img');
    image.setAttribute('width', '700');
    image.setAttribute('height', '400');
    contentDiv.appendChild(image);

    previewForm.replaceImageWidth(image);

    expect(contentDiv.style.transform).toBe('rotate(-90deg)');
    expect(contentDiv.style.transformOrigin).toBe('center center');
    expect(contentDiv.style.width).toBe('');
    expect(contentDiv.style.height).toBe('');
    expect(contentDiv.style.display).toBe('flex');
    expect(figure.style.overflow).toBe('hidden');
    expect(figure.style.paddingLeft).toBe('43px');
  });

  it('should return early if tableWrapper is not found in replaceTableWidth', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: jest.fn(),
    };
    const previewForm = new PreviewForm(props);
    const table = document.createElement('table');
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.dataset.colwidth = '700';
    row.appendChild(cell);
    table.appendChild(row);
    const spy = jest.spyOn(table.style, 'setProperty');

    previewForm.replaceTableWidth(table);

    expect(spy).not.toHaveBeenCalled();
  });

  it('should return early if contentDiv is not found in replaceTableWidth', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: jest.fn(),
    };
    const previewForm = new PreviewForm(props);
    const cell = document.createElement('td');
    cell.dataset.colwidth = '700';
    const row = document.createElement('tr');
    row.appendChild(cell);
    const table = document.createElement('table');
    table.appendChild(row);
    const tableWrapper = document.createElement('div');
    tableWrapper.classList.add('tableWrapper');
    tableWrapper.appendChild(table);
    document.body.appendChild(tableWrapper);
    const spy = jest.spyOn(table.style, 'setProperty');
    previewForm.replaceTableWidth(table);

    expect(spy).not.toHaveBeenCalled();
  });

  it('should calculate width and apply rotation in replaceTableWidth when totalWidth > 624', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: jest.fn(),
    };
    const previewForm = new PreviewForm(props);

    const cell1 = document.createElement('td');
    const cell2 = document.createElement('td');
    cell1.dataset.colwidth = '400';
    cell2.dataset.colwidth = '300';

    const row = document.createElement('tr');
    row.appendChild(cell1);
    row.appendChild(cell2);

    const table = document.createElement('table');
    table.appendChild(row);
    table.style.maxWidth = '';

    const tableWrapper = document.createElement('div');
    tableWrapper.classList.add('tableWrapper');
    tableWrapper.appendChild(table);

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('enhanced-table-figure-content');
    contentDiv.appendChild(tableWrapper);

    const figure = document.createElement('div');
    figure.classList.add('enhanced-table-figure');
    figure.appendChild(contentDiv);

    const tableTitle = document.createElement('div');
    tableTitle.setAttribute('stylename', 'attTableTitle');

    document.body.appendChild(tableTitle);
    document.body.appendChild(figure);
    tableTitle.insertAdjacentElement('afterend', figure);

    Object.defineProperty(table, 'offsetHeight', { value: 500 });

    previewForm.replaceTableWidth(table);

    expect(contentDiv.style.width).toBe('');
    expect(contentDiv.style.height).toBe('');
  });

  it('should not rotate image when width <= 620 in replaceImageWidth', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: jest.fn(),
    };
    const previewForm = new PreviewForm(props);

    const image = document.createElement('img');
    image.setAttribute('width', '600');
    image.setAttribute('height', '400');
    previewForm.replaceImageWidth(image);

    expect(image.style.maxWidth).toBe('');
  });

  it('should not rotate table when totalWidth <= 600 in replaceTableWidth', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: jest.fn(),
    };
    const previewForm = new PreviewForm(props);

    const table = document.createElement('table');
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.dataset.colwidth = '500';
    row.appendChild(cell);
    table.appendChild(row);

    previewForm.replaceTableWidth(table);

    expect(table.style.maxWidth).toBe('');
  });

  it('should return early if table has no rows', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose() { return; },
    };

    const Previewform = new PreviewForm(props);
    const tableElement = document.createElement('table');
    const setStyleSpy = jest.spyOn(tableElement.style, 'setProperty');

    Previewform.replaceTableWidth(tableElement);

    expect(setStyleSpy).not.toHaveBeenCalled();
  });

  it('should call rotateWideTable when pdf-width > 624', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: jest.fn(),
    };

    const previewForm = new PreviewForm(props);
    const rotateSpy = jest
      .spyOn(previewForm as any, 'rotateWideTable')
      .mockImplementation(() => { });

    const table = document.createElement('table');
    table.setAttribute('pdf-width', '700');

    const row = document.createElement('tr');
    const cell = document.createElement('td');
    row.appendChild(cell);
    table.appendChild(row);

    previewForm.replaceTableWidth(table);

    expect(table.style.maxWidth).toBe('600px');
    expect(rotateSpy).toHaveBeenCalledWith(table, 700);
  });
  
  it('should rotate table and apply styles in rotateWideTable', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: jest.fn(),
    };

    const previewForm = new PreviewForm(props);

    const figure = document.createElement('div');
    figure.className = 'enhanced-table-figure';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'enhanced-table-figure-content';

    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'tableWrapper';

    const table = document.createElement('table');
    table.setAttribute('pdf-height', '400');

    Object.defineProperty(table, 'offsetHeight', {
      value: 500,
    });

    tableWrapper.appendChild(table);
    contentDiv.appendChild(tableWrapper);
    figure.appendChild(contentDiv);

    const notesDiv = document.createElement('div');
    notesDiv.className = 'enhanced-table-figure-notes';

    const capcoDiv = document.createElement('div');
    capcoDiv.className = 'enhanced-table-figure-capco';

    contentDiv.appendChild(notesDiv);
    contentDiv.appendChild(capcoDiv);

    const tableTitle = document.createElement('div');
    tableTitle.setAttribute('stylename', 'attTableTitle');

    document.body.appendChild(tableTitle);
    document.body.appendChild(figure);
    tableTitle.insertAdjacentElement('afterend', figure);

    previewForm.rotateWideTable(table, 700);

    expect(contentDiv.style.transform).toBe('rotate(-90deg)');
    expect(contentDiv.style.transformOrigin).toBe('center center');
    expect(contentDiv.style.display).toBe('flex');
    expect(figure.style.width).toBeDefined();
    expect(figure.style.maxWidth).toBe('675px');
    expect(table.style.height).toBe('555px');
    expect(tableWrapper.style.overflow).toBe('hidden');
  });

  it('should return early in rotateWideTable when tableWrapper is missing', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: jest.fn(),
    };

    const previewForm = new PreviewForm(props);
    const table = document.createElement('table');

    previewForm.rotateWideTable(table, 700);

    expect(table.style.height).toBe('');
  });

  it('should return early in rotateWideTable when contentDiv is missing', () => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: jest.fn(),
    };

    const previewForm = new PreviewForm(props);

    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'tableWrapper';

    const table = document.createElement('table');
    tableWrapper.appendChild(table);
    document.body.appendChild(tableWrapper);

    previewForm.rotateWideTable(table, 700);

    expect(table.style.height).toBe('');
  });
});

describe('addLinkEventListeners && handleLinkClick', () => {
  let previewForm;

  beforeEach(() => {
    document.body.innerHTML = `
        <div class="toc-element">
          <a href="#section1">Section 1</a>
        </div>
        <div id="section1">Content of Section 1</div>
      `;
  });

  const props = {
    editorState: {} as unknown as EditorState,
    editorView: {} as unknown as EditorView,
    onClose() {
      return;
    },
  };

  previewForm = new PreviewForm(props);

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should call the function addLinkEventListeners()', () => {
    let test_ = previewForm.addLinkEventListeners();
    const link = document.querySelector('.toc-element a');
    const targetElement = document.getElementById('section1') as HTMLElement;
    const preventDefault = jest.fn();
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'currentTarget', { value: link });
    Object.defineProperty(event, 'preventDefault', { value: preventDefault });
    const scrollIntoView = jest.fn();
    targetElement.scrollIntoView = scrollIntoView;
    expect(test_).toBeUndefined();
  });

  it('should call the function handleLinkClick()', () => {
    const link = document.createElement('a');
    link.setAttribute('href', '#section1');

    const preventDefault = jest.fn();
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'currentTarget', { value: link });
    Object.defineProperty(event, 'preventDefault', { value: preventDefault });

    const targetElement = document.getElementById('section1') as HTMLElement;
    const scrollIntoView = jest.fn();
    targetElement.scrollIntoView = scrollIntoView;

    previewForm.handleLinkClick(event);

    expect(preventDefault).toHaveBeenCalled();
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  describe('Last updated checkbox tests', () => {
    let onCloseMock: jest.Mock;

    beforeEach(() => {
      onCloseMock = jest.fn();
      jest
        .spyOn(document, 'getElementById')
        .mockReturnValue(document.createElement('div'));
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should correctly clone and modify nodes', () => {
      const props = {
        editorView: {} as unknown as EditorView,
        onClose: onCloseMock,
      };

      const previewForm = new PreviewForm(props);
      const testElement = document.createElement('div');
      testElement.innerHTML = '<span>Test Content</span>';
      testElement.setAttribute('data-test', 'value');

      const clonedElement = previewForm.cloneModifyNode(testElement);

      expect(clonedElement).not.toBe(testElement);
      expect(clonedElement.innerHTML).toBe(testElement.innerHTML);
      expect(clonedElement.getAttribute('data-test')).toBe('value');
    });

    it('should handle calcLogic correctly when lastUpdated is true', () => {
      const mockEditorView = {
        dom: {
          parentElement: {
            parentElement: document.createElement('div'),
          },
        },
        state: {
          doc: {
            attrs: {
              objectMetaData: {
                lastEditedOn: '2025-03-20T12:00:00Z',
                name: 'Test Document',
              },
            },
          },
        },
        dispatch: () => { }
      } as unknown as EditorView;

      const props = {
        editorView: mockEditorView,
        onClose: onCloseMock,
      };

      const previewForm = new PreviewForm(props);
      const showAlertSpy = jest
        .spyOn(previewForm, 'showAlert')
        .mockImplementation(() => { });
      PreviewForm['lastUpdated'] = true;
      previewForm?.calcLogic();

      expect(PreviewForm['formattedDate']).toBeDefined();
      expect(showAlertSpy).toHaveBeenCalled();
    });

    it('should handle calcLogic correctly when both isToc and isTitle are true', () => {
      const mockEditorView = {
        dom: {
          parentElement: {
            parentElement: document.createElement('div'),
          },
        },
        state: {
          doc: {
            attrs: {
              objectMetaData: {
                lastEditedOn: '2025-03-20T12:00:00Z',
                name: 'Test Document',
              },
            },
          },
        },
        dispatch: () => { }
      } as unknown as EditorView;

      const props = {
        editorView: mockEditorView,
        onClose: onCloseMock,
      };

      const previewForm = new PreviewForm(props);
      const showAlertSpy = jest
        .spyOn(previewForm, 'showAlert')
        .mockImplementation(() => { });

      previewForm?.calcLogic();
      expect(showAlertSpy).toHaveBeenCalled();
    });
  });
  it('should handle getToc ', () => {
    const schema = new Schema({
      nodes: {
        doc: {
          content: 'block+'
        },
        paragraph: {
          attrs: { styleName: { default: null } },
          content: 'text*',
          group: 'block',
          parseDOM: [{ tag: 'p', getAttrs: dom => ({ styleName: dom.getAttribute('stylename') }) }],
          toDOM(node) {
            return ['p', { stylename: node.attrs.styleName }, 0];
          }
        },
        text: {
          group: 'inline'
        }
      },
      marks: {}
    });
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { styleName: 'TOT Table' },
          content: [{ type: 'text', text: 'Table 1: Revenue by Quarter' }]
        }
      ]
    };
    const newDoc = schema.nodeFromJSON(doc);

    const view = {
      runtime: {
        getStylesAsync: () => {
          return [{ 'toc': true, styleName: 'TOC Heading 1', name: 'TOC Heading 1' },
          { 'tof': true, styleName: 'TOF Figure', name: 'TOF Figure' }, { 'tot': true, styleName: 'TOT Table', name: 'TOT Table' }]
        }
      },
      state: { tr: { doc: newDoc } }
    } as unknown as EditorView;

    jest.spyOn(tcUtils, 'getTableStyles').mockReturnValue([{ 'tot': true, styleName: 'TOT Table', name: 'TOT Table' } as unknown as StoredStyle])
    expect(previewForm.getToc(view)).toBeDefined();
  })
  it('should handle calcLogic', () => {
    jest.spyOn(document, 'getElementById').mockReturnValue(null);
    expect(previewForm.calcLogic()).toBeUndefined();

  })
  it('should handle updateDocumentSectionList', () => {
    previewForm.state.flattenedSectionNodeStructure = [{ isChecked: false }];
    expect(previewForm.updateDocumentSectionList()).toBeUndefined();

  })
  it('should handle showTof', () => {
    expect(PreviewForm.showTof()).toBe(true);

  })
  it('should handle showTot', () => {
    expect(PreviewForm.showTot()).toBe(true);

  })
  it('should handle showCitation', () => {
    expect(PreviewForm.showCitation()).toBe(false);
  })
  it('should handle handleTOCChange ', () => {
    expect(previewForm.handleTOCChange({ target: { checked: true } })).toBeUndefined();
  })
  it('should handle handleTOCChange when checked is false', () => {
    expect(previewForm.handleTOCChange({ target: { checked: false } })).toBeUndefined();
  })
  it('should handle handleTOFChange ', () => {
    expect(previewForm.handleTOFChange({ target: { checked: true } })).toBeUndefined();
  })
  it('should handle handleTOFChange when checked is false', () => {
    expect(previewForm.handleTOFChange({ target: { checked: false } })).toBeUndefined();
  })
  it('should handle handleTOTChange ', () => {
    expect(previewForm.handleTOTChange({ target: { checked: true } })).toBeUndefined();
  })
  it('should handle handleTOTChange when checked is false', () => {
    expect(previewForm.handleTOTChange({ target: { checked: false } })).toBeUndefined();
  })
});

describe('YourClassName', () => {
  let instance: PreviewForm;

  beforeEach(() => {
    const dommock = document.createElement('div');
    const props = {
      editorState: { doc: { attrs: { gg: null } } } as unknown as EditorState,
      editorView: {
        dom: dommock,
        state: { doc: { attrs: { gg: null } } },
        dispatch: () => { }
      } as unknown as EditorView,
      onClose: () => { },
    };
    instance = new PreviewForm(props);
    // reset static flags before each test
    PreviewForm.isTitle = false;
    PreviewForm.lastUpdated = false;
  });

  test('documentTitleActive should set isTitle to true', () => {
    instance.documentTitleActive();
    expect(PreviewForm.isTitle).toBe(true);
  });

  test('documentTitleDeactive should set isTitle to false', () => {
    PreviewForm.isTitle = true;
    instance.documentTitleDeactive();
    expect(PreviewForm.isTitle).toBe(false);
  });
});

describe('addLinkEventListeners && handleLinkClick', () => {
  let previewForm: PreviewForm;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="exportpdf-preview-container">
        <a href="https://external.com" class="external-link">External</a>
        <a href="#section1" class="internal-link">Internal</a>
        <a selectionid="#para1" class="selection-link">Selection</a>
      </div>
      <div id="section1">Section 1 Content</div>
      <p selectionid="#para1">Paragraph 1 Content</p>
    `;

    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: () => {},
    };
    previewForm = new PreviewForm(props);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  it('should add click event listeners to all links', () => {
    const addEventSpy = jest.spyOn(HTMLAnchorElement.prototype, 'addEventListener');
    previewForm.addLinkEventListeners();
    expect(addEventSpy).toHaveBeenCalledTimes(3);
  });

  it('should detect external links', () => {
    expect(previewForm.isExternalLink('https://google.com')).toBe(true);
    expect(previewForm.isExternalLink('http://example.com')).toBe(true);
    expect(previewForm.isExternalLink('mailto:test@test.com')).toBe(true);
    expect(previewForm.isExternalLink('#internal')).toBe(false);
  });

  it('should open external link in new tab', () => {
    const openSpy = jest.spyOn(globalThis, 'open').mockImplementation(() => null);
    previewForm.openExternalLink('https://external.com');
    expect(openSpy).toHaveBeenCalledWith('https://external.com', '_blank', 'noopener,noreferrer');
  });

  it('should handle click on external link', () => {
    const link = document.querySelector('.external-link')!;
    const openSpy = jest.spyOn(previewForm, 'openExternalLink').mockImplementation(() => {});
    const preventDefault = jest.fn();

    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'currentTarget', { value: link });
    Object.defineProperty(event, 'preventDefault', { value: preventDefault });

    previewForm.handleLinkClick(event);
    expect(preventDefault).toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith('https://external.com');
  });

  it('should handle click on internal link by href', () => {
    const link = document.querySelector('.internal-link')!;
    const scrollSpy = jest.spyOn(previewForm, 'scrollToInternalTarget').mockImplementation(() => {});
    const preventDefault = jest.fn();

    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'currentTarget', { value: link });
    Object.defineProperty(event, 'preventDefault', { value: preventDefault });

    previewForm.handleLinkClick(event);
    expect(preventDefault).toHaveBeenCalled();
    expect(scrollSpy).toHaveBeenCalledWith('#section1', null);
  });

  it('should handle click on internal link by selectionId', () => {
    const link = document.querySelector('.selection-link')!;
    const scrollSpy = jest.spyOn(previewForm, 'scrollToInternalTarget').mockImplementation(() => {});
    const preventDefault = jest.fn();

    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'currentTarget', { value: link });
    Object.defineProperty(event, 'preventDefault', { value: preventDefault });

    previewForm.handleLinkClick(event);
    expect(preventDefault).toBeDefined();
    expect(scrollSpy).toBeDefined();
  });
});

describe('PreviewForm.updateStyles', () => {
  let previewForm: PreviewForm;
  const props = {
    editorState: {} as unknown as EditorState,
    editorView: {} as unknown as EditorView,
    onClose: () => {},
  };

  beforeEach(() => {
    previewForm = new PreviewForm(props);
  });

    const callUpdateStyles = (instance: PreviewForm, container: HTMLElement) => {
    (instance as unknown as { updateStyles(data: HTMLElement): void }).updateStyles(container);
  };

  test('updateStyles sets CSS custom properties for reset, prefix, tof and tot attributes', () => {
    const container = document.createElement('div');

    const elReset = document.createElement('div');
    elReset.setAttribute('reset', 'true');

    const elPrefix = document.createElement('div');
    elPrefix.setAttribute('prefix', 'A-1');

    const elTof = document.createElement('div');
    elTof.setAttribute('tof', 'true');

    const elTot = document.createElement('div');
    elTot.setAttribute('tot', 'true');

    container.appendChild(elReset);
    container.appendChild(elPrefix);
    container.appendChild(elTof);
    container.appendChild(elTot);

    callUpdateStyles(previewForm, container);

    expect(elReset.style.getPropertyValue('--reset-flag')).toBe('1');
    expect(elPrefix.style.getPropertyValue('--prefix')).toBe('A-1');
    expect(elTof.style.getPropertyValue('--tof')).toBe('true');
    expect(elTot.style.getPropertyValue('--tot')).toBe('true');
  });

  test('updateStyles ignores non-HTMLElement nodes and leaves other elements untouched', () => {
    const container = document.createElement('div');

    // element without attributes should remain untouched
    const plain = document.createElement('div');
    container.appendChild(plain);

    // a text node should be ignored (not an HTMLElement)
    container.appendChild(document.createTextNode('text-node'));

    callUpdateStyles(previewForm, container);

    expect(plain.style.getPropertyValue('--reset-flag')).toBe('');
  });
   test('sets existing CSS vars for reset, prefix, tof and tot', () => {
    const container = document.createElement('div');

    const elReset = document.createElement('div');
    elReset.setAttribute('reset', 'true');

    const elPrefix = document.createElement('div');
    elPrefix.setAttribute('prefix', 'A-1');

    const elTof = document.createElement('div');
    elTof.setAttribute('tof', 'true');

    const elTot = document.createElement('div');
    elTot.setAttribute('tot', 'true');

    container.appendChild(elReset);
    container.appendChild(elPrefix);
    container.appendChild(elTof);
    container.appendChild(elTot);

    callUpdateStyles(previewForm, container);

    expect(elReset.style.getPropertyValue('--reset-flag')).toBe('1');
    expect(elPrefix.style.getPropertyValue('--prefix')).toBe('A-1');
    expect(elTof.style.getPropertyValue('--tof')).toBe('true');
    expect(elTot.style.getPropertyValue('--tot')).toBe('true');
  });

  test('sets --reset-flag and --prefix and mirrors --tof/--tot only when value is "true"', () => {
    const container = document.createElement('div');

    const elReset = document.createElement('div');
    elReset.setAttribute('reset', 'true');

    const elPrefix = document.createElement('div');
    elPrefix.setAttribute('prefix', 'A-1');

    const elTofTrue = document.createElement('div');
    elTofTrue.setAttribute('tof', 'true');

    const elTotTrue = document.createElement('div');
    elTotTrue.setAttribute('tot', 'true');

    container.appendChild(elReset);
    container.appendChild(elPrefix);
    container.appendChild(elTofTrue);
    container.appendChild(elTotTrue);

    callUpdateStyles(previewForm, container);

    expect(elReset.style.getPropertyValue('--reset-flag')).toBe('1');
    expect(elPrefix.style.getPropertyValue('--prefix')).toBe('A-1');
    expect(elTofTrue.style.getPropertyValue('--tof')).toBe('true');
    expect(elTotTrue.style.getPropertyValue('--tot')).toBe('true');
  });

  test('does NOT set css vars for suffix, start, level, numbering, customflag when selector is restrictive', () => {
    const container = document.createElement('div');

    const elSuffix = document.createElement('div');
    elSuffix.setAttribute('suffix', 'a');

    const elStart = document.createElement('div');
    elStart.setAttribute('start', '5');

    const elLevel = document.createElement('div');
    elLevel.setAttribute('level', '3');

    const elNumbering = document.createElement('div');
    elNumbering.setAttribute('numbering', 'none');

    const elCustom = document.createElement('div');
    elCustom.setAttribute('customflag', 'xyz');

    container.appendChild(elSuffix);
    container.appendChild(elStart);
    container.appendChild(elLevel);
    container.appendChild(elNumbering);
    container.appendChild(elCustom);

    callUpdateStyles(previewForm, container);

    expect(elSuffix.style.getPropertyValue('--suffix')).toBe('');
    expect(elStart.style.getPropertyValue('--start')).toBe('');
    expect(elLevel.style.getPropertyValue('--level')).toBe('');
    expect(elNumbering.style.getPropertyValue('--numbering')).toBe('');
    expect(elCustom.style.getPropertyValue('--customflag')).toBe('');
  });

  test('does NOT mirror tof/tot when values are tokens (e.g. "toc") because selector checks for tof="true"', () => {
    const container = document.createElement('div');

    const elTofToken = document.createElement('div');
    elTofToken.setAttribute('tof', 'toc'); // token value - should be ignored by current selector

    const elTotToken = document.createElement('div');
    elTotToken.setAttribute('tot', 'table-of-tot'); // token value

    container.appendChild(elTofToken);
    container.appendChild(elTotToken);

    callUpdateStyles(previewForm, container);

    expect(elTofToken.style.getPropertyValue('--tof')).toBe('');
    expect(elTotToken.style.getPropertyValue('--tot')).toBe('');
  });

  test('ignores non-HTMLElement nodes and leaves unrelated elements untouched', () => {
    const container = document.createElement('div');

    const plain = document.createElement('div');
    container.appendChild(plain);

    // a matching element that is not an HTMLElement (text node) should be ignored
    container.appendChild(document.createTextNode('text'));

    callUpdateStyles(previewForm, container);

    expect(plain.style.length).toBe(0);
  });

  test('ignores elements without relevant attributes and non-HTMLElements', () => {
    const container = document.createElement('div');

    const plain = document.createElement('div');
    container.appendChild(plain);

    // non-HTMLElement node (text node)
    container.appendChild(document.createTextNode('text'));

    callUpdateStyles(previewForm, container);

    expect(plain.style.length).toBe(0);
  });

  test('does not set CSS var for empty attribute values', () => {
    const container = document.createElement('div');

    const elEmptySuffix = document.createElement('div');
    elEmptySuffix.setAttribute('suffix', '');

    const elEmptyTof = document.createElement('div');
    elEmptyTof.setAttribute('tof', '');

    container.appendChild(elEmptySuffix);
    container.appendChild(elEmptyTof);

    callUpdateStyles(previewForm, container);
    expect(elEmptySuffix.style.getPropertyValue('--suffix')).toBe('');
    expect(elEmptyTof.style.getPropertyValue('--tof')).toBe('');
  });
});

describe('PreviewForm.insertSectionHeaders', () => {
  let previewForm: PreviewForm;
  let mockEditorView: EditorView;

  beforeEach(() => {
    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: jest.fn(),
    };
    previewForm = new PreviewForm(props);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockEditorView = (docType: string = '', docName: string = 'Test Document'): EditorView => {
    return {
      state: {
        doc: {
          attrs: {
            objectMetaData: {
              type: docType,
              name: docName,
            },
          },
        },
      },
    } as unknown as EditorView;
  };

  describe('isAfttpDoc', () => {
    test('should return true for Afttp document types', () => {
      const editorView = createMockEditorView('Afttp-123');
      const result = (previewForm as any).isAfttpDoc(editorView);
      expect(result).toBe(true);
    });

    test('should return false for non-Afttp document types', () => {
      const editorView = createMockEditorView('Regular');
      const result = (previewForm as any).isAfttpDoc(editorView);
      expect(result).toBe(false);
    });

    test('should be case-sensitive (lowercase afttp should return false)', () => {
      const editorView = createMockEditorView('afttp-test');
      const result = (previewForm as any).isAfttpDoc(editorView);
      expect(result).toBe(false);
    });

    test('should return false when docType is undefined', () => {
      const editorView = {
        state: {
          doc: {
            attrs: {
              objectMetaData: {},
            },
          },
        },
      } as unknown as EditorView;
      const result = (previewForm as any).isAfttpDoc(editorView);
      expect(result).toBe(false);
    });
  });

  describe('extractPreChapterNodes', () => {
    test('should extract nodes before first chapterTitle', () => {
      const prose = document.createElement('div');
      prose.classList.add('ProseMirror');
      
      const preNode1 = document.createElement('p');
      preNode1.textContent = 'Pre content 1';
      const preNode2 = document.createElement('p');
      preNode2.textContent = 'Pre content 2';
      const chapterTitle = document.createElement('p');
      chapterTitle.setAttribute('stylename', 'chapterTitle');
      chapterTitle.textContent = 'Chapter 1';
      const postNode = document.createElement('p');
      postNode.textContent = 'Chapter content';
      
      prose.appendChild(preNode1);
      prose.appendChild(preNode2);
      prose.appendChild(chapterTitle);
      prose.appendChild(postNode);

      const extracted = (previewForm as any).extractPreChapterNodes(prose);

      expect(extracted.length).toBe(2);
      expect(prose.children.length).toBe(2); // Only chapterTitle and postNode remain
      expect(prose.children[0]).toBe(chapterTitle);
      expect(prose.children[1]).toBe(postNode);
    });

    test('should return empty array when no chapterTitle is found', () => {
      const prose = document.createElement('div');
      prose.classList.add('ProseMirror');
      prose.innerHTML = '<p>No chapter title</p>';

      const extracted = (previewForm as any).extractPreChapterNodes(prose);

      expect(extracted.length).toBe(0);
    });

    test('should return empty array when chapterTitle is first element', () => {
      const prose = document.createElement('div');
      prose.classList.add('ProseMirror');
      
      const chapterTitle = document.createElement('p');
      chapterTitle.setAttribute('stylename', 'chapterTitle');
      const postNode = document.createElement('p');
      
      prose.appendChild(chapterTitle);
      prose.appendChild(postNode);

      const extracted = (previewForm as any).extractPreChapterNodes(prose);

      expect(extracted.length).toBe(0);
    });

    test('should handle nested chapterTitle within wrapper element', () => {
      const prose = document.createElement('div');
      prose.classList.add('ProseMirror');
      
      const preNode = document.createElement('p');
      const wrapper = document.createElement('div');
      const chapterTitle = document.createElement('p');
      chapterTitle.setAttribute('stylename', 'chapterTitle');
      wrapper.appendChild(chapterTitle);
      
      prose.appendChild(preNode);
      prose.appendChild(wrapper);

      const extracted = (previewForm as any).extractPreChapterNodes(prose);

      expect(extracted.length).toBe(1);
      expect(extracted[0]).toBe(preNode);
    });
  });

  describe('insertTitleSection', () => {
    test('should insert title header with document name when isTitle is true', () => {
      const data = document.createElement('div');
      const editorView = createMockEditorView('', 'My Test Document');
      PreviewForm['isTitle'] = true;

      (previewForm as any).insertTitleSection(data, editorView);

      const titleDiv = data.querySelector('.titleHead');
      expect(titleDiv).toBeTruthy();
      expect(titleDiv?.classList.contains('prepages')).toBe(true);
      
      const header = titleDiv?.querySelector('h4') as HTMLElement;
      expect(header?.textContent).toBe('My Test Document');
      expect(header?.style.color).toBe('rgb(42, 110, 187)');
      expect(header?.style.textAlign).toBe('center');
      expect(header?.style.fontWeight).toBe('bold');
      expect(header?.style.marginBottom).toBe('40px');
    });

    test('should use "Untitled" when document name is not available', () => {
      const data = document.createElement('div');
      const editorView = {
        state: {
          doc: {
            attrs: {
              objectMetaData: {},
            },
          },
        },
      } as unknown as EditorView;

      (previewForm as any).insertTitleSection(data, editorView);

      const header = data.querySelector('.titleHead h4');
      expect(header?.textContent).toBe('Untitled');
    });

    test('should insert page break spacer after title', () => {
      const data = document.createElement('div');
      const editorView = createMockEditorView();

      (previewForm as any).insertTitleSection(data, editorView);

      const spacer = data.querySelector('.forcePageSpacer') as HTMLElement;
      expect(spacer).toBeTruthy();
      expect(spacer?.innerHTML).toBe('&nbsp;');
      expect(spacer?.style.breakAfter).toBe('page');
    });
  });

  describe('insertPrePages', () => {
    test('should wrap nodes in ProseMirror container with prepages class', () => {
      const data = document.createElement('div');
      const node1 = document.createElement('p');
      node1.textContent = 'Pre node 1';
      const node2 = document.createElement('p');
      node2.textContent = 'Pre node 2';

      (previewForm as any).insertPrePages(data, [node1, node2]);

      const prepages = data.querySelector('.prepages');
      expect(prepages).toBeTruthy();
      
      const proseWrapper = prepages?.querySelector('.ProseMirror');
      expect(proseWrapper).toBeTruthy();
      expect(proseWrapper?.getAttribute('contenteditable')).toBe('false');
      expect(proseWrapper?.children.length).toBe(2);
    });

    test('should handle empty nodes array', () => {
      const data = document.createElement('div');

      (previewForm as any).insertPrePages(data, []);

      const prepages = data.querySelector('.prepages');
      expect(prepages).toBeTruthy();
      
      const proseWrapper = prepages?.querySelector('.ProseMirror');
      expect(proseWrapper?.children.length).toBe(0);
    });
  });

  describe('insertOptionalSections', () => {
    test('should insert TOC section when isToc is true', () => {
      const data = document.createElement('div');
      PreviewForm['isToc'] = true;
      PreviewForm['isTof'] = false;
      PreviewForm['isTot'] = false;

      (previewForm as any).insertOptionalSections(data);

      const tocSection = data.querySelector('.tocHead') as HTMLElement;
      expect(tocSection).toBeTruthy();
      expect(tocSection?.id).toBe('licit-toc-block');
      expect(tocSection?.style.breakBefore).toBe('page');
      expect(tocSection?.style.pageBreakBefore).toBe('always');
      expect(tocSection?.style.position).toBe('static');
      expect(tocSection?.style.display).toBe('block');
    });

    test('should insert TOF section when isTof is true', () => {
      const data = document.createElement('div');
      PreviewForm['isToc'] = false;
      PreviewForm['isTof'] = true;
      PreviewForm['isTot'] = false;

      (previewForm as any).insertOptionalSections(data);

      const tofSection = data.querySelector('.tofHead') as HTMLElement;
      expect(tofSection).toBeTruthy();
      expect(tofSection?.id).toBe('licit-tof-block');
      expect(tofSection?.style.breakBefore).toBe('page');
      expect(tofSection?.style.pageBreakBefore).toBe('always');
    });

    test('should insert TOT section when isTot is true', () => {
      const data = document.createElement('div');
      PreviewForm['isToc'] = false;
      PreviewForm['isTof'] = false;
      PreviewForm['isTot'] = true;

      (previewForm as any).insertOptionalSections(data);

      const totSection = data.querySelector('.totHead') as HTMLElement;
      expect(totSection).toBeTruthy();
      expect(totSection?.id).toBe('licit-tot-block');
      expect(totSection?.style.breakBefore).toBe('page');
      expect(totSection?.style.pageBreakBefore).toBe('always');
    });

    test('should insert all sections when all flags are true', () => {
      const data = document.createElement('div');
      PreviewForm['isToc'] = true;
      PreviewForm['isTof'] = true;
      PreviewForm['isTot'] = true;

      (previewForm as any).insertOptionalSections(data);

      expect(data.querySelector('.tocHead')).toBeTruthy();
      expect(data.querySelector('.tofHead')).toBeTruthy();
      expect(data.querySelector('.totHead')).toBeTruthy();
    });

    test('should not insert any sections when all flags are false', () => {
      const data = document.createElement('div');
      PreviewForm['isToc'] = false;
      PreviewForm['isTof'] = false;
      PreviewForm['isTot'] = false;

      (previewForm as any).insertOptionalSections(data);

      expect(data.querySelector('.tocHead')).toBeNull();
      expect(data.querySelector('.tofHead')).toBeNull();
      expect(data.querySelector('.totHead')).toBeNull();
    });

    test('should maintain correct order of sections', () => {
      const data = document.createElement('div');
      PreviewForm['isToc'] = true;
      PreviewForm['isTof'] = true;
      PreviewForm['isTot'] = true;

      (previewForm as any).insertOptionalSections(data);

      const children = Array.from(data.children);
      const tocIndex = children.findIndex(el => el.classList.contains('tocHead'));
      const tofIndex = children.findIndex(el => el.classList.contains('tofHead'));
      const totIndex = children.findIndex(el => el.classList.contains('totHead'));

      expect(tocIndex).toBeLessThan(tofIndex);
      expect(tofIndex).toBeLessThan(totIndex);
    });
  });

  describe('insertSectionHeaders - Integration', () => {
    test('should not insert title when isTitle is false', () => {
      const data = document.createElement('div');
      const editorView = createMockEditorView();
      PreviewForm['isTitle'] = false;

      (previewForm as any).insertSectionHeaders(data, editorView);

      const titleDiv = data.querySelector('.titleHead');
      expect(titleDiv).toBeNull();
    });

    test('should handle Afttp document with pre-chapter nodes', () => {
      const data = document.createElement('div');
      const proseMirror = document.createElement('div');
      proseMirror.classList.add('ProseMirror');
      
      const preNode = document.createElement('p');
      preNode.textContent = 'Pre content';
      const chapterTitle = document.createElement('p');
      chapterTitle.setAttribute('stylename', 'chapterTitle');
      chapterTitle.textContent = 'Chapter 1';
      
      proseMirror.appendChild(preNode);
      proseMirror.appendChild(chapterTitle);
      data.appendChild(proseMirror);

      const editorView = createMockEditorView('Afttp-123');
      PreviewForm['isTitle'] = false;
      PreviewForm['isToc'] = false;
      PreviewForm['isTof'] = false;
      PreviewForm['isTot'] = false;

      (previewForm as any).insertSectionHeaders(data, editorView);

      // Should have prepages container with ProseMirror wrapper
      const prepages = data.querySelector('.prepages .ProseMirror');
      expect(prepages).toBeTruthy();
      expect(prepages?.children.length).toBe(1); // preNode
    });

    test('should clear data innerHTML for Afttp documents', () => {
      const data = document.createElement('div');
      const originalChild = document.createElement('p');
      originalChild.textContent = 'Original content';
      originalChild.id = 'original';
      data.appendChild(originalChild);
      
      const editorView = createMockEditorView('Afttp-Document');
      PreviewForm['isTitle'] = false;
      PreviewForm['isToc'] = false;
      PreviewForm['isTof'] = false;
      PreviewForm['isTot'] = false;

      (previewForm as any).insertSectionHeaders(data, editorView);

      // Original content should be cleared for Afttp
      expect(data.querySelector('#original')).toBeNull();
    });

    test('should append ProseMirror back to data for Afttp documents', () => {
      const data = document.createElement('div');
      const proseMirror = document.createElement('div');
      proseMirror.classList.add('ProseMirror');
      proseMirror.innerHTML = '<p>Content</p>';
      data.appendChild(proseMirror);

      const editorView = createMockEditorView('Afttp-Test');
      PreviewForm['isTitle'] = false;
      PreviewForm['isToc'] = false;
      PreviewForm['isTof'] = false;
      PreviewForm['isTot'] = false;

      (previewForm as any).insertSectionHeaders(data, editorView);

      // ProseMirror should be re-appended
      const proseMirrorElements = data.querySelectorAll(':scope > .ProseMirror');
      expect(proseMirrorElements.length).toBe(1);
    });

    test('should handle document without ProseMirror element', () => {
      const data = document.createElement('div');
      data.innerHTML = '<p>No ProseMirror here</p>';

      const editorView = createMockEditorView();
      PreviewForm['isTitle'] = true;
      PreviewForm['isToc'] = false;
      PreviewForm['isTof'] = false;
      PreviewForm['isTot'] = false;

      expect(() => {
        (previewForm as any).insertSectionHeaders(data, editorView);
      }).not.toThrow();

      // Should still insert title
      expect(data.querySelector('.titleHead')).toBeTruthy();
    });

    test('should handle Afttp document without chapterTitle', () => {
      const data = document.createElement('div');
      const proseMirror = document.createElement('div');
      proseMirror.classList.add('ProseMirror');
      proseMirror.innerHTML = '<p>No chapter title</p>';
      data.appendChild(proseMirror);

      const editorView = createMockEditorView('Afttp-NoChapter');
      PreviewForm['isTitle'] = false;
      PreviewForm['isToc'] = false;
      PreviewForm['isTof'] = false;
      PreviewForm['isTot'] = false;

      expect(() => {
        (previewForm as any).insertSectionHeaders(data, editorView);
      }).not.toThrow();
    });

    test('should not insert prepages for non-Afttp documents', () => {
      const data = document.createElement('div');
      const proseMirror = document.createElement('div');
      proseMirror.classList.add('ProseMirror');
      data.appendChild(proseMirror);

      const editorView = createMockEditorView('Regular-Doc');
      PreviewForm['isTitle'] = false;

      (previewForm as any).insertSectionHeaders(data, editorView);

      // Should not have prepages for non-Afttp
      const prepages = data.querySelector('.prepages');
      expect(prepages).toBeNull();
    });

    test('should handle Afttp document with all features enabled', () => {
      const data = document.createElement('div');
      const proseMirror = document.createElement('div');
      proseMirror.classList.add('ProseMirror');
      
      const preNode = document.createElement('p');
      preNode.textContent = 'Pre content';
      const chapterTitle = document.createElement('p');
      chapterTitle.setAttribute('stylename', 'chapterTitle');
      
      proseMirror.appendChild(preNode);
      proseMirror.appendChild(chapterTitle);
      data.appendChild(proseMirror);

      const editorView = createMockEditorView('Afttp-Full', 'Full Document');
      PreviewForm['isTitle'] = true;
      PreviewForm['isToc'] = true;
      PreviewForm['isTof'] = true;
      PreviewForm['isTot'] = true;

      (previewForm as any).insertSectionHeaders(data, editorView);

      // Check all components are present
      expect(data.querySelector('.titleHead')).toBeTruthy();
      expect(data.querySelector('.forcePageSpacer')).toBeTruthy();
      expect(data.querySelector('.prepages')).toBeTruthy();
      expect(data.querySelector('.tocHead')).toBeTruthy();
      expect(data.querySelector('.tofHead')).toBeTruthy();
      expect(data.querySelector('.totHead')).toBeTruthy();
      expect(data.querySelector(':scope > .ProseMirror')).toBeTruthy();
    });
  });
});

// Add these test cases to the existing describe('PreviewForm component', () => { ... }) block

describe('rotateWideTable', () => {
  let previewForm: PreviewForm;
  let props: any;

  beforeEach(() => {
    props = {
      editorState: {} as unknown as EditorState,
      editorView: {} as unknown as EditorView,
      onClose: jest.fn(),
    };
    previewForm = new PreviewForm(props);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should return early if tableWrapper is not found', () => {
    const table = document.createElement('table');
    document.body.appendChild(table);

    const spy = jest.spyOn(table.style, 'setProperty');
    previewForm.rotateWideTable(table, 700);

    expect(spy).not.toHaveBeenCalled();
  });

  it('should return early if contentDiv is not found', () => {
    const table = document.createElement('table');
    const tableWrapper = document.createElement('div');
    tableWrapper.classList.add('tableWrapper');
    tableWrapper.appendChild(table);
    document.body.appendChild(tableWrapper);

    const spy = jest.spyOn(table.style, 'setProperty');
    previewForm.rotateWideTable(table, 700);

    expect(spy).not.toHaveBeenCalled();
  });

  it('should return early if contentDiv is not an HTMLElement', () => {
    const table = document.createElement('table');
    const tableWrapper = document.createElement('div');
    tableWrapper.classList.add('tableWrapper');
    tableWrapper.appendChild(table);

    const mockContentDiv = document.createTextNode('text');
    const mockClosest = jest.fn()
      .mockReturnValueOnce(tableWrapper)
      .mockReturnValueOnce(mockContentDiv);
    
    table.closest = mockClosest;

    const spy = jest.spyOn(table.style, 'setProperty');
    previewForm.rotateWideTable(table, 700);

    expect(spy).not.toHaveBeenCalled();
  });

  it('should apply rotation styles without figure when figure is not found', () => {
    const table = document.createElement('table');
    const tableWrapper = document.createElement('div');
    tableWrapper.classList.add('tableWrapper');
    tableWrapper.appendChild(table);

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('enhanced-table-figure-content');
    contentDiv.appendChild(tableWrapper);

    document.body.appendChild(contentDiv);

    Object.defineProperty(table, 'offsetHeight', { value: 500, configurable: true });

    previewForm.rotateWideTable(table, 700);

    expect(contentDiv.style.transform).toBe('rotate(-90deg)');
    expect(contentDiv.style.transformOrigin).toBe('center center');
    expect(contentDiv.style.width).toBe('500px');
    expect(contentDiv.style.height).toBe('700px');
    expect(table.style.maxWidth).toBe('none');
    expect(table.style.height).toBe('555px');
  });

  it('should set figure dimensions when figure exists', () => {
    const table = document.createElement('table');
    const tableWrapper = document.createElement('div');
    tableWrapper.classList.add('tableWrapper');
    tableWrapper.appendChild(table);

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('enhanced-table-figure-content');
    contentDiv.appendChild(tableWrapper);

    const figure = document.createElement('div');
    figure.classList.add('enhanced-table-figure');
    figure.appendChild(contentDiv);

    document.body.appendChild(figure);
    Object.defineProperty(table, 'offsetHeight', { value: 500, configurable: true });

    previewForm.rotateWideTable(table, 700);

    expect(figure.style.maxWidth).toBe('675px');
    expect(figure.style.width).toBe('675px');
  });

  it('should move attTableTitle into contentDiv when found', () => {
    const table = document.createElement('table');
    const tableWrapper = document.createElement('div');
    tableWrapper.classList.add('tableWrapper');
    tableWrapper.appendChild(table);

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('enhanced-table-figure-content');
    contentDiv.appendChild(tableWrapper);

    const figure = document.createElement('div');
    figure.classList.add('enhanced-table-figure');
    figure.appendChild(contentDiv);

    const tableTitle = document.createElement('div');
    tableTitle.setAttribute('stylename', 'attTableTitle');
    tableTitle.textContent = 'Table Title';

    document.body.appendChild(tableTitle);
    document.body.appendChild(figure);
    tableTitle.insertAdjacentElement('afterend', figure);

    Object.defineProperty(table, 'offsetHeight', { value: 500, configurable: true });

    previewForm.rotateWideTable(table, 700);

    expect(contentDiv.firstChild).toBe(tableTitle);
    expect(tableTitle.style.textAlign).toBe('left');
    expect(tableTitle.style.alignSelf).toBe('flex-start');
  });

  it('should move chTableTitle into contentDiv when found', () => {
    const table = document.createElement('table');
    const tableWrapper = document.createElement('div');
    tableWrapper.classList.add('tableWrapper');
    tableWrapper.appendChild(table);

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('enhanced-table-figure-content');
    contentDiv.appendChild(tableWrapper);

    const figure = document.createElement('div');
    figure.classList.add('enhanced-table-figure');
    figure.appendChild(contentDiv);

    const tableTitle = document.createElement('div');
    tableTitle.setAttribute('stylename', 'chTableTitle');
    tableTitle.textContent = 'Chapter Table Title';

    document.body.appendChild(tableTitle);
    document.body.appendChild(figure);
    tableTitle.insertAdjacentElement('afterend', figure);

    Object.defineProperty(table, 'offsetHeight', { value: 500, configurable: true });

    previewForm.rotateWideTable(table, 700);

    expect(contentDiv.firstChild).toBe(tableTitle);
    expect(tableTitle.style.textAlign).toBe('left');
    expect(tableTitle.style.alignSelf).toBe('flex-start');
  });

  it('should skip non-title elements when searching for title', () => {
    const table = document.createElement('table');
    const tableWrapper = document.createElement('div');
    tableWrapper.classList.add('tableWrapper');
    tableWrapper.appendChild(table);

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('enhanced-table-figure-content');
    contentDiv.appendChild(tableWrapper);

    const figure = document.createElement('div');
    figure.classList.add('enhanced-table-figure');
    figure.appendChild(contentDiv);

    const otherElement1 = document.createElement('div');
    otherElement1.setAttribute('stylename', 'otherStyle');
    
    const otherElement2 = document.createElement('div');
    otherElement2.setAttribute('stylename', 'anotherStyle');

    const tableTitle = document.createElement('div');
    tableTitle.setAttribute('stylename', 'attTableTitle');

    document.body.appendChild(tableTitle);
    document.body.appendChild(otherElement1);
    document.body.appendChild(otherElement2);
    document.body.appendChild(figure);

    Object.defineProperty(table, 'offsetHeight', { value: 500, configurable: true });

    previewForm.rotateWideTable(table, 700);

    expect(contentDiv.firstChild).toBe(tableTitle);
  });

  it('should use totalWidth as height when offsetHeight is 0', () => {
    const table = document.createElement('table');
    const tableWrapper = document.createElement('div');
    tableWrapper.classList.add('tableWrapper');
    tableWrapper.appendChild(table);

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('enhanced-table-figure-content');
    contentDiv.appendChild(tableWrapper);

    document.body.appendChild(contentDiv);

    Object.defineProperty(table, 'offsetHeight', { value: 0, configurable: true });

    previewForm.rotateWideTable(table, 700);

    expect(contentDiv.style.width).toBe('700px');
  });

  it('should set width on notesDiv when found', () => {
    const table = document.createElement('table');
    const tableWrapper = document.createElement('div');
    tableWrapper.classList.add('tableWrapper');
    tableWrapper.appendChild(table);

    const notesDiv = document.createElement('div');
    notesDiv.classList.add('enhanced-table-figure-notes');

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('enhanced-table-figure-content');
    contentDiv.appendChild(notesDiv);
    contentDiv.appendChild(tableWrapper);

    document.body.appendChild(contentDiv);

    Object.defineProperty(table, 'offsetHeight', { value: 500, configurable: true });

    previewForm.rotateWideTable(table, 700);

    expect(notesDiv.style.width).toBe('700px');
  });

  it('should set width on capcoDiv when found', () => {
    const table = document.createElement('table');
    const tableWrapper = document.createElement('div');
    tableWrapper.classList.add('tableWrapper');
    tableWrapper.appendChild(table);

    const capcoDiv = document.createElement('div');
    capcoDiv.classList.add('enhanced-table-figure-capco');

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('enhanced-table-figure-content');
    contentDiv.appendChild(capcoDiv);
    contentDiv.appendChild(tableWrapper);

    document.body.appendChild(contentDiv);

    Object.defineProperty(table, 'offsetHeight', { value: 500, configurable: true });

    previewForm.rotateWideTable(table, 700);

    expect(capcoDiv.style.width).toBe('700px');
  });

  it('should set width on both notesDiv and capcoDiv when both exist', () => {
    const table = document.createElement('table');
    const tableWrapper = document.createElement('div');
    tableWrapper.classList.add('tableWrapper');
    tableWrapper.appendChild(table);

    const notesDiv = document.createElement('div');
    notesDiv.classList.add('enhanced-table-figure-notes');

    const capcoDiv = document.createElement('div');
    capcoDiv.classList.add('enhanced-table-figure-capco');

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('enhanced-table-figure-content');
    contentDiv.appendChild(notesDiv);
    contentDiv.appendChild(capcoDiv);
    contentDiv.appendChild(tableWrapper);

    document.body.appendChild(contentDiv);

    Object.defineProperty(table, 'offsetHeight', { value: 500, configurable: true });

    previewForm.rotateWideTable(table, 700);

    expect(notesDiv.style.width).toBe('700px');
    expect(capcoDiv.style.width).toBe('700px');
  });

  it('should hide overflow on all parent elements with target classes', () => {
    const table = document.createElement('table');
    
    const tableWrapper = document.createElement('div');
    tableWrapper.classList.add('tableWrapper');
    tableWrapper.appendChild(table);

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('enhanced-table-figure-content');
    contentDiv.appendChild(tableWrapper);

    const figure = document.createElement('div');
    figure.classList.add('enhanced-table-figure');
    figure.appendChild(contentDiv);

    const container = document.createElement('div');
    container.classList.add('container');
    container.appendChild(figure);

    document.body.appendChild(container);

    Object.defineProperty(table, 'offsetHeight', { value: 500, configurable: true });

    previewForm.rotateWideTable(table, 700);

    expect(tableWrapper.style.overflow).toBe('hidden');
    expect(contentDiv.style.overflow).toBe('hidden');
    expect(figure.style.overflow).toBe('hidden');
    expect(container.style.overflow).not.toBe('hidden');
  });

  it('should apply all contentDiv styles correctly', () => {
    const table = document.createElement('table');
    const tableWrapper = document.createElement('div');
    tableWrapper.classList.add('tableWrapper');
    tableWrapper.appendChild(table);

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('enhanced-table-figure-content');
    contentDiv.appendChild(tableWrapper);

    document.body.appendChild(contentDiv);

    Object.defineProperty(table, 'offsetHeight', { value: 500, configurable: true });

    previewForm.rotateWideTable(table, 700);

    expect(contentDiv.style.transform).toBe('rotate(-90deg)');
    expect(contentDiv.style.transformOrigin).toBe('center center');
    expect(contentDiv.style.width).toBe('500px');
    expect(contentDiv.style.height).toBe('700px');
    expect(contentDiv.style.display).toBe('flex');
    expect(contentDiv.style.flexDirection).toBe('column');
    expect(contentDiv.style.alignItems).toBe('center');
  });

  it('should apply all table styles correctly', () => {
    const table = document.createElement('table');
    const tableWrapper = document.createElement('div');
    tableWrapper.classList.add('tableWrapper');
    tableWrapper.appendChild(table);

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('enhanced-table-figure-content');
    contentDiv.appendChild(tableWrapper);

    document.body.appendChild(contentDiv);

    Object.defineProperty(table, 'offsetHeight', { value: 500, configurable: true });

    previewForm.rotateWideTable(table, 700);

    expect(table.style.maxWidth).toBe('none');
    expect(table.style.height).toBe('555px');
  });

  it('should not move title if no previousElementSibling exists', () => {
    const table = document.createElement('table');
    const tableWrapper = document.createElement('div');
    tableWrapper.classList.add('tableWrapper');
    tableWrapper.appendChild(table);

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('enhanced-table-figure-content');
    contentDiv.appendChild(tableWrapper);

    const figure = document.createElement('div');
    figure.classList.add('enhanced-table-figure');
    figure.appendChild(contentDiv);

    document.body.appendChild(figure);

    Object.defineProperty(table, 'offsetHeight', { value: 500, configurable: true });

    const originalFirstChild = contentDiv.firstChild;
    previewForm.rotateWideTable(table, 700);

    expect(contentDiv.firstChild).toBe(originalFirstChild);
  });

  it('should handle complex parent hierarchy correctly', () => {
    const table = document.createElement('table');
    
    const innerWrapper = document.createElement('div');
    innerWrapper.appendChild(table);
    
    const tableWrapper = document.createElement('div');
    tableWrapper.classList.add('tableWrapper');
    tableWrapper.appendChild(innerWrapper);

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('enhanced-table-figure-content');
    contentDiv.appendChild(tableWrapper);

    const figure = document.createElement('div');
    figure.classList.add('enhanced-table-figure');
    figure.appendChild(contentDiv);

    const outerContainer = document.createElement('div');
    outerContainer.appendChild(figure);

    document.body.appendChild(outerContainer);

    Object.defineProperty(table, 'offsetHeight', { value: 500, configurable: true });

    previewForm.rotateWideTable(table, 700);

    expect(innerWrapper.style.overflow).not.toBe('hidden');
    expect(tableWrapper.style.overflow).toBe('hidden');
    expect(contentDiv.style.overflow).toBe('hidden');
    expect(figure.style.overflow).toBe('hidden');
    expect(outerContainer.style.overflow).not.toBe('hidden');
  });
});