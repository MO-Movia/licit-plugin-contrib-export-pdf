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
    expect(contentDiv.style.width).toBe('400px');
    expect(contentDiv.style.height).toBe('700px');
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

    expect(table.style.maxWidth).toBe('none');
    expect(contentDiv.style.transform).toBe('rotate(-90deg)');
    expect(contentDiv.style.display).toBe('flex');
    expect(contentDiv.style.flexDirection).toBe('column');
    expect(contentDiv.style.alignItems).toBe('center');
    expect(contentDiv.style.width).toBe('500px');
    expect(contentDiv.style.height).toBe('700px');
    expect(figure.style.overflow).toBe('hidden');
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

    it('should handle lastUpdatedActive and lastUpdatedDeactive', () => {
      const props = {
        editorView: {} as unknown as EditorView,
        onClose: onCloseMock,
      };

      const previewForm = new PreviewForm(props);
      const calcLogicSpy = jest
        .spyOn(previewForm, 'calcLogic')
        .mockImplementation(() => { });

      previewForm.lastUpdatedActive();
      expect(PreviewForm['lastUpdated']).toBe(true);
      expect(calcLogicSpy).toBeDefined();

    });

    it('should handle handleLastUpdated correctly', () => {
      const props = {
        editorView: {} as unknown as EditorView,
        onClose: onCloseMock,
      };

      const previewForm = new PreviewForm(props);
      const lastUpdatedActiveSpy = jest
        .spyOn(previewForm, 'lastUpdatedActive')
        .mockImplementation(() => { });
      const lastUpdatedDeactiveSpy = jest
        .spyOn(previewForm, 'lastUpdatedDeactive')
        .mockImplementation(() => { });

      previewForm.handleLastUpdated({ target: { checked: true } });
      expect(lastUpdatedActiveSpy).toHaveBeenCalledTimes(1);
      expect(lastUpdatedDeactiveSpy).not.toHaveBeenCalled();

      previewForm.handleLastUpdated({ target: { checked: false } });
      expect(lastUpdatedDeactiveSpy).toHaveBeenCalledTimes(1);
      expect(lastUpdatedActiveSpy).toHaveBeenCalledTimes(1);
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

  test('lastUpdatedActive should set lastUpdated to true', () => {
    instance.lastUpdatedActive();
    expect(PreviewForm.lastUpdated).toBe(true);
  });

  test('lastUpdatedDeactive should set lastUpdated to false', () => {
    PreviewForm.lastUpdated = true;
    instance.lastUpdatedDeactive();
    expect(PreviewForm.lastUpdated).toBe(false);
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
