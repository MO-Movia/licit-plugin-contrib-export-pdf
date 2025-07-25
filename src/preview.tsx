import React from 'react';
import { EditorView } from 'prosemirror-view';
import { Previewer, registerHandlers } from 'pagedjs';
import { MyHandler } from './handlers';
import { createPopUp, atViewportCenter } from '@modusoperandi/licit-ui-commands';
import { Loader } from './loader';
import {
  SectionNodeStructure,
  FlatSectionNodeStructure,
  buildSectionStructure,
  flattenStructure,
  toggleAllSectionChildElements,
  filterDocumentSections,
  buildListOfIdsToRemove,
  buildListOfIdsToAdd,
} from './utils/document-section-utils';
import { Node } from 'prosemirror-model';
import {
  DocumentStyle,
  getTableStyles,
  StoredStyle,
} from './utils/table-of-contents-utils';
import { ExportPDFCommand } from './exportPdfCommand';

interface Props {
  editorView: EditorView;
  onClose: () => void;
}

interface State {
  sections: React.ReactElement<any>[];
  sectionNodeStructure: SectionNodeStructure[];
  flattenedSectionNodeStructure: FlatSectionNodeStructure[];
  sectionNodesToExclude: string[];
  storedStyles: StoredStyle[];
}

export class PreviewForm extends React.PureComponent<Props, State> {
  private static general: boolean = false;
  private static formattedDate: string;
  private static isToc: boolean = true;
  private static isTof: boolean = true;
  private static isTot: boolean = true;
  private static isCitation: boolean = false;
  private static isTitle: boolean = true;
  private static lastUpdated: boolean = false;
  private static readonly tocHeader = [];
  private static readonly tofHeader = [];
  private static readonly totHeader = [];
  private static readonly tocNodeList: Node[] = [];
  private static readonly tofNodeList: Node[] = [];
  private static readonly totNodeList: Node[] = [];
  public sectionListElements: React.ReactElement<any>[] = [];
  private _popUp = null;

  static isGeneral() {
    return PreviewForm.general;
  }

  static showToc() {
    return PreviewForm.isToc;
  }

  static showTof() {
    return PreviewForm.isTof;
  }

  static showTot() {
    return PreviewForm.isTot;
  }

  static showTitle() {
    return PreviewForm.isTitle;
  }

  static showCitation() {
    return PreviewForm.isCitation;
  }

  static getHeadersTOC() {
    return [...this.tocHeader];
  }

    static getHeadersTOF() {
    return [...this.tofHeader];
  }

    static getHeadersTOT() {
    return [...this.totHeader];
  }

      static getTocNodes() {
    return [...this.tocNodeList];
  }

        static getTofNodes() {
    return [...this.tofNodeList];
  }
        static getTotNodes() {
    return [...this.totNodeList];
  }

  constructor(props) {
    super(props);
    this.state = {
      sections: [],
      sectionNodeStructure: [],
      flattenedSectionNodeStructure: [],
      sectionNodesToExclude: [],
      storedStyles: [],
    };
  }

public componentDidMount(): void {
  const paged = new Previewer();
  this.showAlert();

  const { editorView } = this.props;
  this.getToc(editorView);
  PreviewForm.general = true;
  PreviewForm.isToc = true;
  PreviewForm.isTof = true;
  PreviewForm.isTot = true;
  PreviewForm.isTitle = true;

  registerHandlers(MyHandler);

  const divContainer = document.getElementById('holder');
  const data = editorView.dom.parentElement?.parentElement;
  if (!data || !divContainer) return;

  const data1 = data.cloneNode(true) as HTMLElement;

  this.replaceInfoIcons(data1);
  this.updateImageWidths(data1);
  this.prepareEditorContent(data1);

  editorView.dispatch(editorView.state?.tr.setMeta('suppressOnChange', true));

  paged.preview(data1, [], divContainer).then(() => {
    this.InfoActive();
  });
}


  public showAlert(): void {
    const anchor = null;
    this._popUp = createPopUp(Loader, null, {
      anchor,
      modal: true,
      autoDismiss: false,
      position: atViewportCenter,
      onClose: () => {
        if (this._popUp) {
          this._popUp = null;
        }
      },
    });
  }

  public replaceImageWidth = (imageElement): void => {
    // Get the original width of the image.
    const originalWidth = parseInt(imageElement.getAttribute('width'), 10);

    if (originalWidth > 600) {
      imageElement.style.maxWidth = '600px';
    }
  };

  public getToc = async (view): Promise<void> => {
    const styles = (await view.runtime.getStylesAsync()) as DocumentStyle[];
const storeTOCvalue = getTableStyles(styles, 'toc');
const storeTOFvalue = getTableStyles(styles, 'tof');
const storeTOTvalue = getTableStyles(styles, 'tot');
    

    view?.state?.tr?.doc.descendants((node: Node) => {
      if (node.attrs.styleName) {
        for (const tofValue of storeTOFvalue) {
          if (tofValue.name === node.attrs.styleName) {
            PreviewForm.tofNodeList.push(node);
            PreviewForm.tofHeader.push(node.attrs.styleName);
          }
        }

         for (const totValue of storeTOTvalue) {
          if (totValue.name === node.attrs.styleName) {
            PreviewForm.totNodeList.push(node);
            PreviewForm.totHeader.push(node.attrs.styleName);
          }
        }
        for (const tocValue of storeTOCvalue) {
          if (tocValue.name === node.attrs.styleName) {
            PreviewForm.tocNodeList.push(node);
            PreviewForm.tocHeader.push(node.attrs.styleName);
          }
        }
      }
    });

    const sectionNodeStructure = buildSectionStructure(
      PreviewForm.tocNodeList,
      storeTOCvalue
    );
    const flattenedSectionNodeStructure =
      flattenStructure(sectionNodeStructure);

    this.setState((prevState) => {
      return {
        ...prevState,
        storedStyles: storeTOCvalue,
        flattenedSectionNodeStructure,
        sectionNodeStructure,
      };
    });

    this.renderTocList(this.state.sectionNodeStructure);
  };

  public updateDocumentSectionList(sectionId: string): void {
    const flattenedSectionNodeStructure =
      this.state.flattenedSectionNodeStructure;
    let newNodeList: string[] = [];

    if (this.state.sectionNodesToExclude.includes(sectionId)) {
      newNodeList = buildListOfIdsToAdd(
        sectionId,
        this.state.sectionNodesToExclude,
        flattenedSectionNodeStructure
      );
    } else {
      toggleAllSectionChildElements(
        flattenedSectionNodeStructure,
        sectionId,
        true
      );
      newNodeList = buildListOfIdsToRemove(
        sectionId,
        this.state.sectionNodesToExclude,
        flattenedSectionNodeStructure
      );
    }

    this.setState(
      (prevState) => {
        return {
          ...prevState,
          sectionNodesToExclude: newNodeList,
        };
      },
      () => {
        this.calcLogic();
      }
    );
  }

  public render(): React.ReactElement<any> {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{ border: 'solid', visibility: 'hidden' }}
          className="exportpdf-preview-container"
        >
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div
              id="holder"
              className="preview-container"
              style={{
                height: '90vh',
                width: 'auto',
                overflowY: 'auto',
              }}
            ></div>

            <div
              style={{
                height: '90vh',
                background: 'rgb(226 226 226)',
                position: 'relative',
              }}
            >
              <div style={{ padding: '20px', color: '#000000' }}>
                <h6>Options:</h6>
                <div
                  style={{
                    marginTop: '10px',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <input
                      type="checkbox"
                      name="TOC"
                      id="licit-pdf-export-toc-option"
                      onChange={this.handleTOCChange}
                      defaultChecked={true}
                    />{' '}
                  </div>

                  <label
                    htmlFor="licit-pdf-export-toc-option"
                    style={{ marginLeft: '5px' }}
                  >
                    Include TOC
                  </label>
                </div>
                                <div
                  style={{
                    marginTop: '10px',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <input
                      type="checkbox"
                      name="TOF"
                      id="licit-pdf-export-tof-option"
                      onChange={this.handleTOFChange}
                      defaultChecked={true}
                    />{' '}
                  </div>

                  <label
                    htmlFor="licit-pdf-export-tof-option"
                    style={{ marginLeft: '5px' }}
                  >
                    Include TOF
                  </label>
                </div>
                                <div
                  style={{
                    marginTop: '10px',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <input
                      type="checkbox"
                      name="TOT"
                      id="licit-pdf-export-tot-option"
                      onChange={this.handleTOTChange}
                      defaultChecked={true}
                    />{' '}
                  </div>

                  <label
                    htmlFor="licit-pdf-export-tot-option"
                    style={{ marginLeft: '5px' }}
                  >
                    Include TOT
                  </label>
                </div>

                <div
                  style={{
                    marginTop: '8px',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <input
                      type="checkbox"
                      name="infoicon"
                      id="licit-pdf-export-title-option"
                      onChange={this.handelDocumentTitle}
                      defaultChecked={true}
                    />{' '}
                  </div>

                  <label
                    htmlFor="licit-pdf-export-title-option"
                    style={{ marginLeft: '5px' }}
                  >
                    Document title
                  </label>
                </div>

                <div
                  style={{
                    marginTop: '8px',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <input
                      type="checkbox"
                      name="infoicon"
                      id="licit-pdf-export-citation-option"
                      onChange={this.handelCitation}
                    />{' '}
                  </div>

                  <label
                    htmlFor="licit-pdf-export-citation-option"
                    style={{ marginLeft: '5px' }}
                  >
                    Citation
                  </label>
                </div>

                <div
                  style={{
                    marginTop: '8px',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <input
                      type="checkbox"
                      name="infoicon"
                      id="licit-pdf-export-last-updated-option"
                      onClick={this.handleLastUpdated}
                    />{' '}
                  </div>

                  <label
                    htmlFor="licit-pdf-export-citation-option"
                    style={{ marginLeft: '5px' }}
                  >
                    Last updated
                  </label>
                </div>

                <h6 style={{ marginRight: 'auto', marginTop: '30px' }}>
                  Document Sections:
                </h6>

                <div
                  key="{this.props.sections}"
                  id="licit-pdf-export-sections-list"
                  style={{
                    borderRadius: '5px',
                    marginTop: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    background: '#fff',
                    width: '300px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    overflowX: 'auto',
                    paddingLeft: '10px',
                  }}
                >
                  {this.state.sections}
                </div>
              </div>

              <div
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  padding: '5px',
                  display: 'flex',
                  flexDirection: 'row',
                }}
              >
                <button onClick={this.handleConfirm}>Confirm</button>
                <button onClick={this.handleCancel}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  public handelDocumentTitle = (event): void => {
    if (event.target.checked) {
      this.documentTitleActive();
    } else {
      this.documentTitleDeactive();
    }
  };

  public handleLastUpdated = (event): void => {
    if (event.target.checked) {
      this.lastUpdatedActive();
    } else {
      this.lastUpdatedDeactive();
    }
  };

  public handelCitation = (event): void => {
    if (event.target.checked) {
      this.citationActive();
    } else {
      this.citationDeactive();
    }
  };

  public handleTOCChange = (event) => {
    if (event.target.checked) {
      this.tocActive();
    } else {
      this.Tocdeactive();
    }
  };

    public handleTOTChange = (event) => {
    if (event.target.checked) {
      this.totActive();
    } else {
      this.Totdeactive();
    }
  };

    public handleTOFChange = (event) => {
    if (event.target.checked) {
      this.tofActive();
    } else {
      this.Tofdeactive();
    }
  };

  public documentTitleActive = (): void => {
    PreviewForm.isTitle = true;
    this.calcLogic();
  };

  public documentTitleDeactive = (): void => {
    PreviewForm.isTitle = false;
    this.calcLogic();
  };

  public lastUpdatedActive = (): void => {
    PreviewForm.lastUpdated = true;
    this.calcLogic();
  }

  public lastUpdatedDeactive = (): void => {
    PreviewForm.lastUpdated = false;
    this.calcLogic();
  }


  public citationActive = (): void => {
    PreviewForm.isCitation = true;
    this.calcLogic();
  };

  public insertFooters = (CitationIcons, trialHtml): void => {
    const selector = trialHtml.querySelector('.ProseMirror');
    if (CitationIcons.length > 0) {
      for (let i = 0; i < 7; i++) {
        if (i === 4) {
          const citation_header = document.createElement('h4');
          citation_header.textContent = 'Endnotes';
          citation_header.style.color = 'blue';
          citation_header.setAttribute('stylename', PreviewForm.tocHeader[0]);
          selector.appendChild(citation_header);
        } else if (i === 5) {
          const underline = document.createElement('div');
          underline.style.width = '350px';
          underline.style.height = '1px';
          underline.style.marginTop = '-5px';
          underline.style.backgroundColor = '#000000';
          selector.appendChild(underline);
        } else {
          const blankDiv = document.createElement('div');
          selector.appendChild(blankDiv);
          const nbsp = document.createTextNode('\u00A0');
          selector.appendChild(nbsp);
        }
      }
    }

    CitationIcons.forEach((CitationIcon, index) => {
      const description =
        CitationIcon.getAttribute('overallcitationcapco') +
        ' ' +
        CitationIcon.getAttribute('author') +
        ' ' +
        CitationIcon.getAttribute('referenceId') +
        ' ' +
        'Date Published' +
        ' ' +
        CitationIcon.getAttribute('publisheddate') +
        ' ' +
        'ICOD Date' +
        ' ' +
        CitationIcon.getAttribute('icod') +
        ' ' +
        CitationIcon.getAttribute('documenttitlecapco') +
        ' ' +
        CitationIcon.getAttribute('documenttitle') +
        ' ' +
        'pp.' +
        ' ' +
        CitationIcon.getAttribute('pages') +
        ' ' +
        'Extracted information is' +
        ' ' +
        CitationIcon.getAttribute('extractedinfocapco') +
        ' ' +
        'Overall document classification is' +
        ' ' +
        CitationIcon.getAttribute('overalldocumentcapco') +
        ' ' +
        'Data Accessed' +
        ' ' +
        CitationIcon.getAttribute('dateaccessed') +
        ' ' +
        CitationIcon.getAttribute('hyperlink') +
        ' ' +
        'Declasify Date' +
        ' ' +
        CitationIcon.getAttribute('declassifydate');
      const newDiv = document.createElement('div');
      const indexSpan = document.createElement('span');
      indexSpan.textContent = `[${index + 1}]`;
      indexSpan.style.fontSize = '80%';

      const spaceTextNode = document.createTextNode('  ');

      const descriptionSpan = document.createElement('span');
      descriptionSpan.textContent = description;
      descriptionSpan.style.fontSize = '80%';

      // Append the span elements to the new div
      newDiv.appendChild(indexSpan);
      newDiv.appendChild(spaceTextNode);
      newDiv.appendChild(descriptionSpan);
      selector.appendChild(newDiv);
    });
  };

  public citationDeactive = (): void => {
    PreviewForm.isCitation = false;
    this.calcLogic();
  };

  public cloneModifyNode = (data: HTMLElement) => {
    return data.cloneNode(true) as HTMLElement;
  };

  public addLinkEventListeners = (): void => {
    const links = document.querySelectorAll('.toc-element a');
    links.forEach((link) => {
      link.addEventListener('click', this.handleLinkClick);
    });
  };

  public handleLinkClick = (event: MouseEvent): void => {
    event.preventDefault();
    const targetId = (event.currentTarget as HTMLAnchorElement)
      .getAttribute('href')
      ?.slice(1);
    if (targetId) {
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

public calcLogic = (): void => {
  const divContainer = document.getElementById('holder');
  if (!divContainer) return;
  divContainer.innerHTML = '';

  const { editorView } = this.props;
  const data = editorView.dom.parentElement?.parentElement;
  if (!data) return;

  let data1 = this.cloneModifyNode(data);
  this.prepareEditorContent(data1);

  data1 = filterDocumentSections(
    data1,
    PreviewForm.tocNodeList,
    this.state.sectionNodesToExclude,
    this.state.storedStyles
  );

  if (PreviewForm.isCitation) {
    this.replaceCitations(data1);
  }

  if (PreviewForm.lastUpdated) {
    this.setLastUpdated(editorView);
  }

  this.insertSectionHeaders(data1, editorView);
  this.replaceInfoIcons(data1);
  this.updateImageWidths(data1);

  const paged = new Previewer();
  this._popUp?.close();
  this.showAlert();

  editorView.dispatch(editorView.state.tr?.setMeta('suppressOnChange', true));

  paged.preview(data1, [], divContainer).then(() => {
    const previewContainer = document.querySelector('.exportpdf-preview-container') as HTMLElement;
    if (previewContainer) previewContainer.style.visibility = 'visible';
    this.addLinkEventListeners();
    this._popUp?.close();
  });
};



private prepareEditorContent(data: HTMLElement): void {
  const proseMirror = data.querySelector('.ProseMirror');
  if (proseMirror) {
    proseMirror.setAttribute('contenteditable', 'false');
    proseMirror.classList.remove('czi-prosemirror-editor');
    proseMirror.querySelectorAll('.molm-czi-image-view-body-img-clip span').forEach(span => {
      (span as HTMLElement).style.display = 'flex';
    });
  }
}

private replaceCitations(data: HTMLElement): void {
  const citations = data.querySelectorAll('.citationnote');
  citations.forEach((el, idx) => {
    const sup = document.createElement('sup');
    sup.textContent = `[${idx + 1}]`;
    el.parentNode?.replaceChild(sup, el);
  });
  this.insertFooters(citations, data);
}

private setLastUpdated(editorView): void {
  const lastEdited = editorView?.state?.doc?.attrs?.objectMetaData?.lastEditedOn;
  const date = new Date(lastEdited);
  PreviewForm.formattedDate = date.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

private insertSectionHeaders(data: HTMLElement, editorView): void {
  const sections = [
    { flag: PreviewForm.isToc, className: 'tocHead' },
    { flag: PreviewForm.isTof, className: 'tofHead' },
    { flag: PreviewForm.isTot, className: 'totHead' }
  ];

  const parentDiv = document.createElement('div');
  let hasContent = false;

  if (PreviewForm.isTitle) {
    parentDiv.classList.add('titleHead');
    const header = document.createElement('h4');
    header.style.marginBottom = '40px';
    header.style.color = '#2A6EBB';
    header.style.textAlign = 'center';
    header.style.fontWeight = 'bold';
    header.textContent = editorView?.state?.doc?.attrs?.objectMetaData?.name;
    parentDiv.appendChild(header);
    hasContent = true;
  }

  sections.forEach(({ flag, className }) => {
    if (flag) {
      const sectionDiv = document.createElement('div');
      sectionDiv.classList.add(className);
      parentDiv.appendChild(sectionDiv);
      hasContent = true;
    }
  });

  if (hasContent) {
    data.insertBefore(parentDiv, data.firstChild);
  }
}

private replaceInfoIcons(data: HTMLElement): void {
  const icons = data.querySelectorAll('.infoicon');
  icons.forEach((icon, index) => {
    const sup = document.createElement('sup');
    sup.textContent = `${index + 1}`;
    icon.textContent = '';
    icon.appendChild(sup);
  });
}

private updateImageWidths(data: HTMLElement): void {
  for (const element of data.children) {
    const images = element.querySelectorAll('img');
    images.forEach((img) => {
      this.replaceImageWidth(img);
    });
  }
}

  public tocActive = (): void => {
    PreviewForm.isToc = true;
    this.calcLogic();
  };

    public tofActive = (): void => {
    PreviewForm.isTof = true;
    this.calcLogic();
  };

    public totActive = (): void => {
    PreviewForm.isTot = true;
    this.calcLogic();
  };

  public InfoActive = (): void => {
    this.calcLogic();
  };

  public Tocdeactive = (): void => {
    PreviewForm.isToc = false;
    this.calcLogic();
  };

    public Tofdeactive = (): void => {
    PreviewForm.isTof = false;
    this.calcLogic();
  };

    public Totdeactive = (): void => {
    PreviewForm.isTot = false;
    this.calcLogic();
  };

  public handleCancel = (): void => {
    PreviewForm.isToc = false;
    PreviewForm.isTof = false;
    PreviewForm.isTot = false;
    PreviewForm.general = false;
    PreviewForm.isTitle = false;
    PreviewForm.isCitation = false;
    ExportPDFCommand.closePreviewForm();
    this.props.onClose();
  };

  public handleConfirm = (): void => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      let divContainer = document.getElementById('holder');
      printWindow.document.open();
      printWindow.document.write(
        `<!DOCTYPE html><html><head><title>LICIT</title></head><body></body></html>`
      );

      while (printWindow.document.documentElement.firstChild) {
        printWindow.document.documentElement.removeChild(
          printWindow.document.documentElement.firstChild
        );
      }
      for (const childNode of divContainer.childNodes) {
        printWindow.document.documentElement.appendChild(
          childNode.cloneNode(true)
        );
      }

      printWindow.document.documentElement.appendChild(
        document.createElement('head')
      );

      this.prepareCSSRules(printWindow.document);
      printWindow.document.close();
      printWindow.print();
    }
    ExportPDFCommand.closePreviewForm();
    this.props.onClose();
  };

  public prepareCSSRules = (doc): void => {
    const sheets = document.styleSheets;
    for (const sheet of sheets) {
      const rules = sheet.cssRules;
      const styles = [];
      const styleElement = doc.createElement('style') as HTMLElement;
      for (const rule of rules) {
        styles.push(rule.cssText);
        const attributes = (sheet.ownerNode as HTMLElement)?.attributes;
        for (const attribute of attributes ?? []) {
          styleElement?.setAttribute(attribute.name, attribute.value);
        }
      }
      const styleText = styles.join('\n');
      styleElement.textContent = styleText;
      doc.head.appendChild(styleElement);
    }
  };

  private renderTocList(
    structure: SectionNodeStructure[],
    isChildElement = false
  ): void {
    for (const section of structure) {
      const uniqueSectionId = `licit-pdf-export-${section.id}`;
      const indentIncrement = 15;
      let indentAmount = '0';

      if (section.level > 1) {
        indentAmount = `${(section.level - 1) * indentIncrement}px`;
      }

      this.sectionListElements.push(
        <div
          key={section.id}
          style={{
            padding: '5px 10px',
            paddingLeft: indentAmount,
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            alignItems: 'center',
            minWidth: '100%',
            width: 'auto',
          }}
        >
          <div>
            <input
              style={{ cursor: 'pointer' }}
              type="checkbox"
              name="infoicon"
              id={uniqueSectionId}
              value="on"
              onChange={() => this.updateDocumentSectionList(section.id)}
              defaultChecked={true}
            />{' '}
          </div>

          <label
            htmlFor={uniqueSectionId}
            style={{ cursor: 'pointer', marginLeft: '5px', textWrap: 'nowrap' }}
          >
            {section.title}
          </label>
        </div>
      );

      if (section.children.length) {
        this.renderTocList(section.children, true);
      }
    }

    if (!isChildElement) {
      this.setState((prevState) => {
        return { ...prevState, sections: this.sectionListElements };
      });
    }
  }
}
