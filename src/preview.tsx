import React from 'react';
import { EditorView } from 'prosemirror-view';
import { Previewer, registerHandlers, registeredHandlers } from 'pagedjs';
import { PDFHandler } from './handlers';
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
  private static readonly tocHeader: string[] = [];
  private static readonly tofHeader: string[] = [];
  private static readonly totHeader: string[] = [];
  private static readonly tocNodeList: Node[] = [];
  private static readonly tofNodeList: Node[] = [];
  private static readonly totNodeList: Node[] = [];
  private static documentTitle: string = '';
  private static pageBanner: {
    text: string;
    color: string;
  } | null = null;
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
    PreviewForm.pageBanner = null;
    const paged = new Previewer();
    this.showAlert();

    const { editorView } = this.props;
    this.getToc(editorView);
    PreviewForm.general = true;
    PreviewForm.isToc = true;
    PreviewForm.isTof = true;
    PreviewForm.isTot = true;
    PreviewForm.isTitle = true;
    if (!registeredHandlers.includes(PDFHandler)) {
      registerHandlers(PDFHandler);
    }
    const divContainer = document.getElementById('holder');
    const data = editorView.dom?.parentElement?.parentElement;
    if (!data || !divContainer) return;

    const data1 = data.cloneNode(true) as HTMLElement;
    this.insertSectionHeaders(data1, editorView);
    this.replaceInfoIcons(data1);
    this.updateImageWidths(data1);
    this.prepareEditorContent(data1);
    this.updateTableWidths(data1);
    if (this.isAfttpDoc(editorView)) {
      const markingData  = this.extractBannerMarkingFromTableWrapper(data1);
      const docTitle = this.getDocumentTitle(editorView);
      PreviewForm.documentTitle = docTitle;
      PreviewForm.pageBanner = markingData ;
    } else {
      PreviewForm.pageBanner = null;
      PreviewForm.documentTitle = null;
    }
    editorView.dispatch(editorView.state?.tr.setMeta('suppressOnChange', true));
    PDFHandler.state.isOnLoad = true;
    paged.preview(data1, [], divContainer).then(() => {
      PDFHandler.state.isOnLoad = false;
      this.calcLogic()
    });
  }

  public showAlert(): void {
    const anchor = null;
    PDFHandler.state.currentPage = 0;
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
    const originalWidth = Number.parseInt(imageElement.getAttribute('width'), 10);
    if (originalWidth < 620) return;

    const contentDiv = imageElement.closest('.enhanced-table-figure-content') as HTMLElement | null;
    if (!contentDiv) return;

    if (contentDiv.dataset?.orientation === 'landscape') {
      contentDiv.style.width = '544px';
      contentDiv.style.height = '854px';

      const clip = contentDiv.getElementsByClassName('molm-czi-image-view-body-img-clip')[0] as HTMLElement | undefined;
      if (clip?.firstElementChild) {
        (clip.firstElementChild as HTMLElement).style.width = '854px';
        (clip.firstElementChild as HTMLElement).style.height = '544px';
      }

      const imgBody = contentDiv.getElementsByClassName('molm-czi-image-view-body-img')[0] as HTMLElement | undefined;
      if (imgBody) imgBody.style.width = '854px';

      const img = contentDiv.getElementsByTagName('img')[0];
      if (img) {
        img.setAttribute('height', '544');
        img.setAttribute('width', '854');
      }
    }

    const figure = contentDiv.closest('.enhanced-table-figure');
    if (figure) {
      this.pullFigureTitleIntoContent(figure as HTMLElement, contentDiv);
    }

    // Rotate the entire content div counter-clockwise 90 degrees
    Object.assign(contentDiv.style, {
      transform: 'rotate(-90deg)',
      transformOrigin: 'center center',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    });

    imageElement.style.maxWidth = 'none';

    const notesDiv = contentDiv.closest('.enhanced-table-figure-notes');
    if (notesDiv) (notesDiv as HTMLElement).style.width = `${originalWidth}px`;

    if (figure) {
      (figure  as HTMLElement).style.overflow = 'hidden';
      (figure as HTMLElement) .style.paddingLeft = '43px';
    }
  };

  private pullFigureTitleIntoContent(figure: HTMLElement, contentDiv: HTMLElement): void {
    let prevElement = figure.previousElementSibling;
    while (prevElement) {
      const styleName = prevElement.getAttribute('stylename');
      if (styleName === 'attFigureTitle' || styleName === 'chFigureTitle') {
        contentDiv.insertBefore(prevElement, contentDiv.firstChild);
        (prevElement as HTMLElement).style.textAlign = 'left';
        (prevElement as HTMLElement).style.alignSelf = 'flex-start';
        (prevElement as HTMLElement).style.marginLeft = '-132px';
        break;
      }
      prevElement = prevElement.previousElementSibling;
    }
  }

  public replaceTableWidth = (tableElement: HTMLElement): void => {

    // Calculate total width from data-colwidth of first row
    const firstRow = tableElement.querySelector('tr');
    if (!firstRow) return;

    let totalWidth = tableElement.getAttribute('pdf-width') ? Number(tableElement.getAttribute('pdf-width')) : 0;

    if (totalWidth > 600) {
      tableElement.style.maxWidth = '600px';

      // Rotate table if width exceeds 624px
      if (totalWidth > 624) {
        this.rotateWideTable(tableElement, totalWidth);
      }
    }
  };

  public extractBannerMarkingFromTableWrapper(
    root: HTMLElement
  ): { text: string; color: string } | null {

    // Only first row matters
    const firstRow = root.querySelector('.tableWrapper tr');
    if (!firstRow) return null;

    // Find elements that explicitly define color
    const styledElements = Array.from(
      firstRow.querySelectorAll<HTMLElement>('[style]')
    ).filter(el =>
      /color\s{0,10}:\s{0,10}[^;]{1,50}/i.test(
        el.getAttribute('style') || ''
      )
    );
    if (!styledElements.length) return null;

    // Pick the deepest one (most specific)
    const target = styledElements.at(-1);

    const styleAttr = target.getAttribute('style');
    const match = /color\s{0,10}:\s{0,10}([^;]{1,50})/i.exec(styleAttr);
    if (!match) return null;

    return {
      text: target.textContent?.trim() ?? '',
      color: match[1].trim(),
    };
  }

  rotateWideTable(tableElement: HTMLElement, totalWidth: number): void {
    const TABLE_MAX_WIDTH = 675;
    const TABLE_FIXED_HEIGHT = 555;
    const EXTRA_BLOCK_HEIGHT = 70;
    const MAX_ROTATED_WIDTH = 670;

    const tableWrapper = tableElement.closest<HTMLElement>('.tableWrapper');
    if (!tableWrapper) return;

    const contentDiv =
      tableWrapper.closest<HTMLElement>('.enhanced-table-figure-content');
    if (!contentDiv) return;

    const figure =
      contentDiv.closest<HTMLElement>('.enhanced-table-figure') ?? null;

    let tableContHeight =
      Number(tableElement.getAttribute('pdf-height')) || undefined;

    const tableHeight = tableElement.offsetHeight || totalWidth;

    const notesDiv = contentDiv.querySelector<HTMLElement>(
      '.enhanced-table-figure-notes'
    );
    const capcoDiv = contentDiv.querySelector<HTMLElement>(
      '.enhanced-table-figure-capco'
    );

    if (figure) {
      Object.assign(figure.style, {
        maxWidth: `${TABLE_MAX_WIDTH}px`,
        width: `${TABLE_MAX_WIDTH}px`,
      });

      // Move table title inside contentDiv
      let prev = figure.previousElementSibling as HTMLElement | null;
      while (prev) {
        const styleName = prev.getAttribute('stylename');
        if (styleName === 'attTableTitle' || styleName === 'chTableTitle') {
          contentDiv.insertBefore(prev, contentDiv.firstChild);
          Object.assign(prev.style, {
            textAlign: 'left',
            alignSelf: 'flex-start',
          });
          break;
        }
        prev = prev.previousElementSibling as HTMLElement | null;
      }
    }

    // ---------- NOTES & CAPCO ----------
    this.adjustNotesCapcoAndFigureWidth(
      notesDiv,
      capcoDiv,
      figure,
      totalWidth,
      tableContHeight,
      EXTRA_BLOCK_HEIGHT,
      MAX_ROTATED_WIDTH
    );

    // ---------- ROTATION ----------
    Object.assign(contentDiv.style, {
      transform: 'rotate(-90deg)',
      transformOrigin: 'center center',
      width: `${tableHeight}px`,
      height: `${totalWidth}px`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    });

    Object.assign(tableElement.style, {
      maxWidth: 'none',
      height: `${TABLE_FIXED_HEIGHT}px`,
    });

    // ---------- OVERFLOW HIDING ----------
    const overflowStyle = {
      overflow: 'hidden',
      overflowX: 'hidden',
      overflowY: 'hidden',
    };

    const targetClasses = new Set([
      'enhanced-table-figure',
      'enhanced-table-figure-content',
      'tableWrapper',
      'tablewrapper',
    ]);

    let parent: HTMLElement | null = tableElement.parentElement;

    while (parent) {
      const hasTargetClass = Array.from(targetClasses).some(cls =>
        parent.classList.contains(cls)
      );

      if (hasTargetClass) {
        Object.assign(parent.style, overflowStyle);
      }

      parent = parent.parentElement;
    }

  }

  private adjustNotesCapcoAndFigureWidth(
    notesDiv: HTMLElement | null,
    capcoDiv: HTMLElement | null,
    figure: HTMLElement | null,
    totalWidth: number,
    tableContHeight: number,
    EXTRA_BLOCK_HEIGHT: number,
    MAX_ROTATED_WIDTH: number
  ): void {
    if (notesDiv) {
      notesDiv.style.width = `${totalWidth}px`;
      tableContHeight += EXTRA_BLOCK_HEIGHT;
    }

    if (capcoDiv) {
      capcoDiv.style.width = `${totalWidth}px`;
      tableContHeight += EXTRA_BLOCK_HEIGHT;
    }

    if (figure && tableContHeight < MAX_ROTATED_WIDTH) {
      figure.style.width = `${tableContHeight}px`;
    }
  }

  public getToc = async (view): Promise<void> => {
      // Reset static lists
    PreviewForm.tocNodeList.length = 0;
    PreviewForm.tocHeader.length = 0;
    PreviewForm.tofNodeList.length = 0;
    PreviewForm.tofHeader.length = 0;
    PreviewForm.totNodeList.length = 0;
    PreviewForm.totHeader.length = 0;
    const styles = (await view.runtime.getStylesAsync()) as DocumentStyle[];
    const storeTOCvalue = getTableStyles(styles, 'toc');
    const storeTOFvalue = getTableStyles(styles, 'tof');
    const storeTOTvalue = getTableStyles(styles, 'tot');


    view?.state?.tr?.doc.descendants((node: Node) => {
      if (!node.attrs.styleName) {
        return;
      }
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
      () => {}
    );
  }

  public render(): React.ReactElement<any> {
    const getButtonStyle = (color: string): React.CSSProperties => ({
      backgroundColor: color,
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      padding: '8px 16px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    });

    const handleHover = (
      e: React.MouseEvent<HTMLButtonElement>,
      bg: string,
      shadow: string
    ) => {
      e.currentTarget.style.backgroundColor = bg;
      e.currentTarget.style.boxShadow = shadow;
    };
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
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                    border: '1px solid #ccc',
                  }}
                >
                  {this.state.sections}
                </div>
              </div>
              <div
                style={{
                  marginTop: '8px',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingLeft: '20px',
                }}
              >
                <button
                  onClick={this.handleApply}
                  style={getButtonStyle('#4CAF50')}
                  onMouseEnter={e => handleHover(e, '#45a049', '0 4px 8px rgba(0,0,0,0.25)')}
                  onMouseLeave={e => handleHover(e, '#4CAF50', '0 2px 4px rgba(0,0,0,0.2)')}
                >
                  Apply
                </button>
              </div>

              <div
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  padding: '5px',
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '10px',
                }}
              >
                <button
                  onClick={this.handleConfirm}
                  style={getButtonStyle('#4CAF50')}
                  onMouseEnter={e => handleHover(e, '#45a049', '0 4px 8px rgba(0,0,0,0.25)')}
                  onMouseLeave={e => handleHover(e, '#4CAF50', '0 2px 4px rgba(0,0,0,0.2)')}
                >
                  Confirm
                </button>

                <button
                  onClick={this.handleCancel}
                  style={getButtonStyle('#f44336')}
                  onMouseEnter={e => handleHover(e, '#d32f2f', '0 4px 8px rgba(0,0,0,0.25)')}
                  onMouseLeave={e => handleHover(e, '#f44336', '0 2px 4px rgba(0,0,0,0.2)')}
                >
                  Cancel
                </button>
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

  public handelCitation = (e: { target: { checked: boolean } }): void => {
    if (e.target.checked) {
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
  };

  public documentTitleDeactive = (): void => {
    PreviewForm.isTitle = false;
  };

  public citationActive = (): void => {
    PreviewForm.isCitation = true;
  };

  public insertFooters = (CitationIcons, trialHtml): void => {
    const icons: HTMLElement[] = Array.from(CitationIcons as Iterable<HTMLElement>); 
    const selector = trialHtml.querySelector('.ProseMirror');
    if (icons.length > 0) {
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

  for (const [index, CitationIcon] of icons.entries()) {
    const get = (attr: string) => CitationIcon.getAttribute(attr) ?? '';

    const description = [
      get('overallcitationcapco'),
      get('author'),
      get('referenceId'),
      'Date Published',
      get('publisheddate'),
      'ICOD Date',
      get('icod'),
      get('documenttitlecapco'),
      get('documenttitle'),
      'pp.',
      get('pages'),
      'Extracted information is',
      get('extractedinfocapco'),
      'Overall document classification is',
      get('overalldocumentcapco'),
      'Data Accessed',
      get('dateaccessed'),
      get('hyperlink'),
      'Declasify Date',
      get('declassifydate'),
    ].filter(Boolean).join(' ');

    const newDiv = document.createElement('div');

    const indexSpan = document.createElement('span');
    indexSpan.textContent = `[${index + 1}]`;
    indexSpan.style.fontSize = '80%';

    const spaceTextNode = document.createTextNode('  ');

    const descriptionSpan = document.createElement('span');
    descriptionSpan.textContent = description;
    descriptionSpan.style.fontSize = '80%';

    newDiv.appendChild(indexSpan);
    newDiv.appendChild(spaceTextNode);
    newDiv.appendChild(descriptionSpan);
    selector.appendChild(newDiv);
  }
  };

  public citationDeactive = (): void => {
    PreviewForm.isCitation = false;
  };

  public cloneModifyNode = (data: HTMLElement) => {
    return data.cloneNode(true) as HTMLElement;
  };

  public addLinkEventListeners = (): void => {
    const links = document.querySelectorAll('.exportpdf-preview-container a');
    for (const [_, link] of links.entries()) {
      link.addEventListener('click', this.handleLinkClick);
    }
  };

  public handleLinkClick = (event: MouseEvent): void => {
    const link = event.currentTarget as HTMLAnchorElement;
    const href = link.getAttribute('href');
    const selectionId = link.getAttribute('selectionid');

    // Skip if no href
    if (!href) return;

    if (this.isExternalLink(href)&& !selectionId) {
      event.preventDefault();
      this.openExternalLink(href);
    } else {
      event.preventDefault();
      this.scrollToInternalTarget(href, selectionId);
    }
  };

  // Check if a link is external if it startsWith http:// ,https:// or mailto:
  isExternalLink = (href: string): boolean => {
    return href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:');
  };

  // Open external links safely
  openExternalLink = (href: string): void => {
    globalThis.open(href, '_blank', 'noopener,noreferrer');
  };

  // Scroll to internal target
  scrollToInternalTarget = (href: string, selectionId: string | null): void => {
    let targetElement: Element | null = null;

    // Check if href is an ID (starts with #) or a selectionId (starts with #)
    // For TOC links, href will be like #id for internal links selectionId will be like #id
    if (href?.startsWith('#')) {
      const targetId = href.slice(1);
      targetElement = document.getElementById(targetId);
    } else if (selectionId?.startsWith('#')) {
      const targetId = selectionId.slice(1);
      const container = document.querySelector('.exportpdf-preview-container');
      if (!container) return;

      targetElement = container.querySelector(
        `p[selectionid="#${CSS.escape(targetId)}"]`
      );
    }

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  public calcLogic = (): void => {
    PreviewForm.pageBanner = null;

    const divContainer = document.getElementById('holder');
    if (!divContainer) return;
    divContainer.innerHTML = '';

    const { editorView } = this.props;
    const data = editorView.dom?.parentElement?.parentElement;
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
    
    this.setLastUpdated(editorView);
    this.insertSectionHeaders(data1, editorView);
    this.replaceInfoIcons(data1);
    this.updateImageWidths(data1);
    this.updateTableWidths(data1);
    this.updateStyles(data1);
    if (this.isAfttpDoc(editorView)) {
      const markingData  = this.extractBannerMarkingFromTableWrapper(data1);
      const docTitle = this.getDocumentTitle(editorView);
      PreviewForm.documentTitle = docTitle;
      PreviewForm.pageBanner = markingData ;
    } else {
      PreviewForm.pageBanner = null;
      PreviewForm.documentTitle = null;
    }

    const paged = new Previewer();
    this._popUp?.close();
    this.showAlert();

    editorView.dispatch(editorView.state.tr?.setMeta('suppressOnChange', true));

    paged.preview(data1, [], divContainer).then(() => {
      const previewContainer: HTMLElement = document.querySelector('.exportpdf-preview-container');
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
      const spans = proseMirror.querySelectorAll<HTMLElement>(
        '.molm-czi-image-view-body-img-clip span'
      );
      for (const span of spans) {
        span.style.display = 'flex';
      }
    }
  }

  private replaceCitations(data: HTMLElement): void {
    const citations: HTMLElement[] = Array.from(
      data.querySelectorAll<HTMLElement>('.citationnote')
    );

    for (const [idx, el] of citations.entries()) {
      const sup = document.createElement('sup');
      sup.textContent = `[${idx + 1}]`;

      if (el.parentNode) {
        el.parentNode.replaceChild(sup, el);
      }
    }
    this.insertFooters(citations, data);
  }

  private setLastUpdated(editorView): void {
    const lastEdited = editorView?.state?.doc?.attrs?.objectMetaData?.lastEditedOn;
    const date = new Date(lastEdited);
    PreviewForm.formattedDate = date.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  private insertSectionHeaders(data: HTMLElement, editorView): void {
    const isAfttp = this.isAfttpDoc(editorView);

    if (!isAfttp) {
      this.insertSectionHeadersLegacy(data, editorView);
      return;
    }

    this.removeExistingHeaders(data);

    const prose = data.querySelector<HTMLElement>('.ProseMirror');
    const preNodes =
      prose ? this.extractPreChapterNodes(prose) : [];

    data.innerHTML = '';

    if (PreviewForm.isTitle) {
      this.insertTitleSection(data, editorView);
    }

    if (preNodes.length > 0) {
      this.insertPrePages(data, preNodes);
    }

    this.insertOptionalSections(data);

    if (prose) {
      data.appendChild(prose);
    }
  }


  private insertSectionHeadersLegacy(data: HTMLElement, editorView): void {
  const elements = data.querySelectorAll<HTMLElement>(
    '.titleHead, .forcePageSpacer, .tocHead, .tofHead, .totHead'
  );

  for (const el of elements) el.remove();

  let insertBeforeNode: ChildNode | null = data.firstChild;

  if (PreviewForm.isTitle) {
    const titleDiv = document.createElement('div');
    titleDiv.classList.add('titleHead', 'prepages');

    const header = document.createElement('h4');
    header.style.marginBottom = '40px';
    header.style.color = '#2A6EBB';
    header.style.textAlign = 'center';
    header.style.fontWeight = 'bold';
    header.textContent =
      editorView?.state?.doc?.attrs?.objectMetaData?.name ?? 'Untitled';

    titleDiv.appendChild(header);
    insertBeforeNode?.before(titleDiv);
    insertBeforeNode = titleDiv.nextSibling;

    const titleSpacer = document.createElement('div');
    titleSpacer.classList.add('forcePageSpacer');
    titleSpacer.innerHTML = '&nbsp;';
    insertBeforeNode?.before(titleSpacer);
    insertBeforeNode = titleSpacer.nextSibling;
  }

  const sections = [
    { flag: PreviewForm.isToc, className: 'tocHead' },
    { flag: PreviewForm.isTof, className: 'tofHead' },
    { flag: PreviewForm.isTot, className: 'totHead' },
  ];

  for (const { flag, className } of sections) {
    if (!flag) continue;

    const sectionDiv = document.createElement('div');
    sectionDiv.classList.add(className);
    insertBeforeNode?.before(sectionDiv);
    insertBeforeNode = sectionDiv.nextSibling;

    const spacer = document.createElement('div');
    spacer.classList.add('forcePageSpacer');
    spacer.innerHTML = '&nbsp;';
    insertBeforeNode?.before(spacer);
    insertBeforeNode = spacer.nextSibling;
  }
}

  private removeExistingHeaders(root: HTMLElement): void {
    const nodes = root.querySelectorAll<HTMLElement>(
      '.titleHead, .forcePageSpacer, .tocHead, .tofHead, .totHead, .prepages'
    );

    for (const el of nodes) {
      el.remove();
    }
  }

  private isAfttpDoc(editorView): boolean {
  const docType =
    editorView?.state?.doc?.attrs?.objectMetaData?.type ?? '';
  return typeof docType === 'string' && docType.includes('Afttp');
 }

  public getDocumentTitle(editorView): string {
    return editorView?.state?.doc?.attrs?.objectMetaData?.name ?? '';
  }

  private extractPreChapterNodes(prose: HTMLElement): ChildNode[] {
    const proseChildren = Array.from(prose.childNodes);
    const firstChapter = prose.querySelector<HTMLElement>(
      'p[stylename="chapterTitle"]'
    );

    if (!firstChapter) return [];

    let anchorIndex = -1;
    for (let i = 0; i < proseChildren.length; i++) {
      const n = proseChildren[i];
      if (n === firstChapter || (n instanceof HTMLElement && n.contains(firstChapter))) {
        anchorIndex = i;
        break;
      }
    }

    if (anchorIndex <= 0) return [];

    const extracted: ChildNode[] = [];
    for (let i = 0; i < anchorIndex; i++) {
      const n = proseChildren[i] as unknown as ChildNode;
      n.remove();
      extracted.push(n);
    }

    return extracted;
  }

  private insertTitleSection(data: HTMLElement, editorView): void {
    const titleDiv = document.createElement('div');
    titleDiv.classList.add('titleHead', 'prepages');

    const header = document.createElement('h4');
    Object.assign(header.style, {
      marginBottom: '40px',
      color: '#2A6EBB',
      textAlign: 'center',
      fontWeight: 'bold',
    });

    header.textContent =
      editorView?.state?.doc?.attrs?.objectMetaData?.name ?? 'Untitled';

    titleDiv.appendChild(header);
    data.appendChild(titleDiv);

    const spacer = document.createElement('div');
    spacer.classList.add('forcePageSpacer');
    spacer.innerHTML = '&nbsp;';
    spacer.style.breakAfter = 'page';

    data.appendChild(spacer);
 }

  private insertPrePages(data: HTMLElement, nodes: ChildNode[]): void {
    const container = document.createElement('div');
    container.classList.add('prepages');

    const proseWrapper = document.createElement('div');
    proseWrapper.classList.add('ProseMirror');
    proseWrapper.setAttribute('contenteditable', 'false');

    for (const n of nodes) {
      proseWrapper.appendChild(n);
    }

    container.appendChild(proseWrapper);
    data.appendChild(container);
  }
 
  private insertOptionalSections(data: HTMLElement): void {
    const sections = [
      { flag: PreviewForm.isToc, className: 'tocHead', id: 'licit-toc-block' },
      { flag: PreviewForm.isTof, className: 'tofHead', id: 'licit-tof-block' },
      { flag: PreviewForm.isTot, className: 'totHead', id: 'licit-tot-block' },
    ];

    for (const { flag, className, id } of sections) {
      if (!flag) continue;

      const div = document.createElement('div');
      div.classList.add(className);
      div.id = id;

      Object.assign(div.style, {
        position: 'static',
        display: 'block',
        breakBefore: 'page',
        pageBreakBefore: 'always',
      });

      data.appendChild(div);
    }
  }

    private replaceInfoIcons(data: HTMLElement): void {
      const icons = data.querySelectorAll<HTMLElement>('.infoicon');
      for (const [index, icon] of icons.entries()) {
        const sup = document.createElement('sup');
        sup.textContent = `${index + 1}`;
        icon.textContent = '';
        icon.appendChild(sup);
      }
    }

    private updateImageWidths(data: HTMLElement): void {
      for (const element of Array.from(data.children)) {
        const images = element.querySelectorAll<HTMLImageElement>('img');
        for (const [_, img] of images.entries()) {
          this.replaceImageWidth(img);
        }
      }
    }

    private updateStyles(data: HTMLElement): void {
      const elements = data.querySelectorAll<HTMLElement>(
        '[reset="true"], [prefix], [tof="true"], [tot="true"]'
      );

      for (const [_, el] of elements.entries()) {
        const reset = el.getAttribute('reset');
        const prefix = el.getAttribute('prefix');
        const tof = el.getAttribute('tof');
        const tot = el.getAttribute('tot');

        if (reset === 'true') el.style.setProperty('--reset-flag', '1');
        if (prefix) el.style.setProperty('--prefix', prefix);
        if (tof === 'true') el.style.setProperty('--tof', tof);
        if (tot === 'true') el.style.setProperty('--tot', tot);
      }
    }

  private updateTableWidths(data: HTMLElement): void {
    for (const element of data.children) {
      const tables = element.querySelectorAll('table');
      for (const table of tables) {
        this.replaceTableWidth(table);
      }
    }
  }

  public tocActive = (): void => {
    PreviewForm.isToc = true;
  };

  public tofActive = (): void => {
    PreviewForm.isTof = true;
  };

  public totActive = (): void => {
    PreviewForm.isTot = true;
  };

  public Tocdeactive = (): void => {
    PreviewForm.isToc = false;
  };

  public Tofdeactive = (): void => {
    PreviewForm.isTof = false;
  };

  public Totdeactive = (): void => {
    PreviewForm.isTot = false;
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
      printWindow.document.writeln('<!DOCTYPE html><html><body></body></html>');

    const docElement = printWindow.document.documentElement;
      while (docElement.firstChild) {
          docElement.firstChild.remove();
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

      printWindow.document.title = 'LICIT';
      printWindow.document.close();
      printWindow.print();
    }
    ExportPDFCommand.closePreviewForm();
    this.props.onClose();
  };

  public handleApply = (): void => {
    this.calcLogic();
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
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#fff',
            transition: 'background 0.2s',
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
