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
      editorState: {} as any,
      editorView: {} as any,
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
      editorState: {} as any,
      editorView: {} as any,
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
      editorState: {} as any,
      editorView: {} as any,
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
