import { PreviewForm } from './preview';
import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';
import { sampleFlattenedStructure, sampleSectionNodeStructure } from './test-data/document-nodes';

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
      editorState: {doc: {attrs: {gg: null}}} as unknown as EditorState,
      editorView: {dom: dommock} as unknown as EditorView,
      onClose: () => {},
    };
    const prevForm = new PreviewForm(props);
    PreviewForm.isToc = true;
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
      editorState: {doc: {attrs: {gg: null}}} as unknown as EditorState,
      editorView: {
        dom: dommock,
        state: {doc: {attrs: {gg: null}}},
      } as unknown as EditorView,
      onClose: () => {},
    };
    const prevForm = new PreviewForm(props);

    PreviewForm.isTitle = true;
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
      editorState: {doc: {attrs: {gg: null}}} as unknown as EditorState,
      editorView: {
        dom: dommock,
        state: {doc: {attrs: {gg: null}}},
      } as unknown as EditorView,
      onClose: () => {},
    };
    const prevForm = new PreviewForm(props);
    jest.spyOn(prevForm, 'insertFooters').mockImplementation(() => {});

    PreviewForm.isToc = false;
    PreviewForm.isTitle = true;
    PreviewForm.isCitation = true;

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
        write: jest.fn(),
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
    jest.spyOn(previewForm, 'prepareCSSRules').mockImplementation(() => {});
    previewForm.handleConfirm();
    expect(window.open).toHaveBeenCalledWith('', '_blank');
    expect(printWindowMock.document.open).toHaveBeenCalled();
    expect(printWindowMock.document.write).toHaveBeenCalledWith(
      expect.stringContaining(
        '<!DOCTYPE html><html><head><title>LICIT</title></head><body></body></html>'
      )
    );
    expect(printWindowMock.document.documentElement.firstChild).not.toBeNull();
    expect(printWindowMock.document.documentElement.appendChild).not.toBeNull();
    expect(printWindowMock.document.close).toHaveBeenCalled();
    expect(printWindowMock.print).toHaveBeenCalled();
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('should handle handelDocumentTitle ', () => {
    const props = {
      editorState: {} as any,
      editorView: {} as any,
      onClose: onCloseMock,
    };

    const previewForm = new PreviewForm(props);
    const spy = jest
      .spyOn(previewForm, 'calcLogic')
      .mockImplementation(() => {});
    previewForm.handelDocumentTitle({target: {checked: true}});
    expect(spy).toHaveBeenCalled();
  });

  it('should handle handelDocumentTitle when checked is false', () => {
    const props = {
      editorState: {} as any,
      editorView: {} as any,
      onClose: onCloseMock,
    };

    const previewForm = new PreviewForm(props);
    const spy = jest
      .spyOn(previewForm, 'calcLogic')
      .mockImplementation(() => {});
    previewForm.handelDocumentTitle({target: {checked: false}});
    expect(spy).toHaveBeenCalled();
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
      .mockImplementation(() => {});
    previewForm.handelCitation({target: {checked: true}});
    expect(spy).toHaveBeenCalled();
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
      .mockImplementation(() => {});
    previewForm.handelCitation({target: {checked: false}});
    expect(spy).toHaveBeenCalled();
  });

  it('should handle handleTOCChange   ', () => {
    const props = {
      editorState: {} as any,
      editorView: {} as any,
      onClose: onCloseMock,
    };

    const previewForm = new PreviewForm(props);
    const spy = jest
      .spyOn(previewForm, 'calcLogic')
      .mockImplementation(() => {});
    previewForm.handleTOCChange({target: {checked: true}});
    expect(spy).toHaveBeenCalled();
  });

  it('should handle handleTOCChange  when checked is false', () => {
    const props = {
      editorState: {} as any,
      editorView: {} as any,
      onClose: onCloseMock,
    };

    const previewForm = new PreviewForm(props);
    const spy = jest
      .spyOn(previewForm, 'calcLogic')
      .mockImplementation(() => {});
    previewForm.handleTOCChange({target: {checked: false}});
    expect(spy).toHaveBeenCalled();
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

  it('should call the function componentDidMount()', () => {
    const el = document.createElement('div');
    const prosimer_cls_element = document.createElement('div');
    prosimer_cls_element.className = 'ProseMirror';
    el.appendChild(prosimer_cls_element);
    jest.spyOn(document, 'getElementById').mockReturnValue(el);

    const props = {
      editorState: {} as unknown as EditorState,
      editorView: {
        dom: {parentElement: {parentElement: el}},
      } as unknown as EditorView,
      onClose() {
        return;
      },
    };
    const Previewform = new PreviewForm(props);
    const spy = jest.spyOn(Previewform, 'getToc').mockReturnValue(null);
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
              {styles: {toc: true}, name: 'style1'},
              {styles: {toc: true}, name: 'style2'},
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
    const targetElement = document.getElementById('section1');
    const preventDefault = jest.fn();
    const event = new MouseEvent('click', {bubbles: true});
    Object.defineProperty(event, 'currentTarget', {value: link});
    Object.defineProperty(event, 'preventDefault', {value: preventDefault});
    const scrollIntoView = jest.fn();
    targetElement.scrollIntoView = scrollIntoView;
    expect(test_).toBeUndefined();
  });

  it('should call the function handleLinkClick()', () => {
    const link = document.createElement('a');
    link.setAttribute('href', '#section1');

    const preventDefault = jest.fn();
    const event = new MouseEvent('click', {bubbles: true});
    Object.defineProperty(event, 'currentTarget', {value: link});
    Object.defineProperty(event, 'preventDefault', {value: preventDefault});

    const targetElement = document.getElementById('section1');
    const scrollIntoView = jest.fn();
    targetElement.scrollIntoView = scrollIntoView;

    previewForm.handleLinkClick(event);

    expect(preventDefault).toHaveBeenCalled();
    expect(scrollIntoView).toHaveBeenCalledWith({behavior: 'smooth'});
  });

  it('should handle InfoActive and call calcLogic', () => {
    const spy = jest
      .spyOn(previewForm, 'calcLogic')
      .mockImplementation(() => {});

    previewForm.InfoActive();
    expect(spy).toHaveBeenCalled();
  });

  describe('updateDocumentSectionList', () => {
    it('should add selection from exclude list', () => {
      const previewForm = new PreviewForm(props);
      jest.spyOn(previewForm, 'calcLogic').mockReturnValue(undefined);
      previewForm.setState((prevState) => {
        return {
          ...prevState,
          flattenedSectionNodeStructure: sampleFlattenedStructure
        }
      });
      
      previewForm.updateDocumentSectionList('1');

      setTimeout(() => {
        expect(previewForm.state.sectionNodesToExclude).toEqual(['1']);
      }, 500);
    });

    it('should remove selection from exclude list', () => {
      const previewForm = new PreviewForm(props);
      jest.spyOn(previewForm, 'calcLogic').mockReturnValue(undefined);
      previewForm.setState((prevState) => {
        return {
          ...prevState,
          sectionNodesToExclude: ['1', '2'],
          flattenedSectionNodeStructure: sampleFlattenedStructure
        }
      });
      
      previewForm.updateDocumentSectionList('2');

      setTimeout(() => {
        expect(previewForm.state.sectionNodesToExclude).toEqual(['1']);
      }, 500);
    });
  });

  describe('renderTocList', () => {
    it('should build toc List', () => {
      const previewForm = new PreviewForm(props);
      previewForm['renderTocList'](sampleSectionNodeStructure);

      setTimeout(() => {
        expect(previewForm.state.sections.length).toBeGreaterThan(1);
      }, 500);
    });
  });
});
