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
  buildListOfIdsToAdd
} from './utils/document-section-utils';
import { Node } from 'prosemirror-model';
import { DocumentStyle, getTableOfContentStyles, StoredStyle } from './utils/table-of-contents-utils';

interface Props {
  editorView: EditorView;
  onClose: () => void;
}

interface State {
  sections: React.ReactNode[];
  sectionNodeStructure: SectionNodeStructure[];
  flattenedSectionNodeStructure: FlatSectionNodeStructure[];
  sectionNodesToExclude: string[];
  storedStyles: StoredStyle[];
}

export class PreviewForm extends React.PureComponent<Props, State> {
  public static general: boolean = false;
  public static isToc: boolean = false;
  public static isCitation: boolean = false;
  public static isTitle: boolean = false;
  public static tocHeader = [];
  public tocNodeList: Node[] = [];
  public sectionListElements: React.ReactNode[] = [];
  private _popUp = null;

  constructor(props) {
    super(props);
    this.state = {
      sections: [],
      sectionNodeStructure: [],
      flattenedSectionNodeStructure: [],
      sectionNodesToExclude: [],
      storedStyles: []
    };
  }

  public componentDidMount(): void {
    const {editorView} = this.props;
    this.getToc(editorView);
    PreviewForm.general = true;
    registerHandlers(MyHandler);
    const divContainer = document.getElementById('holder');
    const data = editorView.dom.parentElement.parentElement;
    const data1 = data.cloneNode(true) as HTMLElement;
    const infoIcons = data1.querySelectorAll('.infoicon');
    infoIcons.forEach((infoIcon, index) => {
      const superscript = document.createElement('sup');
      superscript.textContent = (index + 1).toString();
      infoIcon.textContent = '';
      infoIcon.appendChild(superscript);
    });
    for (const element of data1.children) {
      const imageElements = element.querySelectorAll('img');
      for (const imageElement of imageElements) {
        // Replace the width attribute with the desired new width value (capped at 600px if original width is larger).
        this.replaceImageWidth(imageElement);
      }
    }
    const prosimer_cls_element = data1.querySelector('.ProseMirror');
    prosimer_cls_element.setAttribute('contenteditable', 'false');
    const paged = new Previewer();
    paged.preview(data1, [], divContainer).then((flow) => {
      this.InfoActive();
    });
  }

  public showAlert(): void {
    const anchor = null;
    this._popUp = createPopUp(Loader, null, {
      anchor,
      position: atViewportCenter,
      onClose: () => {
        if (this._popUp) {
          this._popUp = null;
        }
      },
    });
  }

  public replaceImageWidth = (imageElement): void => {
    const originalWidth = parseInt(imageElement.getAttribute('width'), 10);

    if (originalWidth > 600) imageElement.style.maxWidth = '600px';
  };

  public getToc = async (view): Promise<void> => {
    const styles = await view.runtime.getStylesAsync() as DocumentStyle[];
    const storeTOCvalue = getTableOfContentStyles(styles);

    view?.state?.tr?.doc.descendants((node: Node) => {
      if (node.attrs.styleName) {
        for (const tocValue of storeTOCvalue) {
          if (tocValue.name === node.attrs.styleName) {
            this.tocNodeList.push(node);
            PreviewForm.tocHeader.push(node.attrs.styleName);
          }
        }
      }
    });

    const sectionNodeStructure = buildSectionStructure(this.tocNodeList, storeTOCvalue);
    const flattenedSectionNodeStructure = flattenStructure(sectionNodeStructure);

    this.setState((prevState) => {
      return({
        ...prevState,
        storedStyles: storeTOCvalue,
        flattenedSectionNodeStructure,
        sectionNodeStructure,
      });
    });

    this.renderTocList(this.state.sectionNodeStructure);
  };

  public updateDocumentSectionList(sectionId: string): void {
    const flattenedSectionNodeStructure = this.state.flattenedSectionNodeStructure;
    let newNodeList: string[] = [];

    if (this.state.sectionNodesToExclude.includes(sectionId)) {
      newNodeList = buildListOfIdsToAdd(
        sectionId,
        this.state.sectionNodesToExclude,
        flattenedSectionNodeStructure
      );
    } else {
      toggleAllSectionChildElements(flattenedSectionNodeStructure, sectionId, true);
      newNodeList = buildListOfIdsToRemove(
        sectionId,
        this.state.sectionNodesToExclude,
        flattenedSectionNodeStructure
      );
    }

    this.setState((prevState) => {
      return({
        ...prevState,
        sectionNodesToExclude: newNodeList
      });
    }, () => { this.calcLogic(); });
  }

  public render(): React.ReactNode {
    return (
      <div className='export-pdf-modal-wrapper'>
        <div className="export-pdf-modal">
          <div className="export-pdf-preview" id="holder"></div>

          <div className='export-pdf-sidebar-container'>
            <button className='export-pdf-close-modal-icon' onClick={this.handleCancel}>&#x2716;</button>

            <div className='export-pdf-sidebar-controls'>
              <h6>Options:</h6>

              <div className='export-pdf-sidebar-toggle'>
                <input id="licit-pdf-export-toc-option" name="TOC" onChange={this.handleTOCChange} type="checkbox" />
                <label htmlFor="licit-pdf-export-toc-option">Include TOC</label>
              </div>

              <div className='export-pdf-sidebar-toggle'>
                <input id="licit-pdf-export-title-option" name="infoicon" onChange={this.handelDocumentTitle} type="checkbox" />
                <label htmlFor="licit-pdf-export-title-option">Document title</label>
              </div>

              <div className='export-pdf-sidebar-toggle'>
                <input id="licit-pdf-export-citation-option" name="infoicon" onChange={this.handelCitation} type="checkbox" />
                <label htmlFor="licit-pdf-export-citation-option">Citation</label>
              </div>

              <h6 style={{ marginRight: 'auto', marginTop: '30px' }}>Document Sections:</h6>

              <div className='export-pdf-sections-list' id='licit-pdf-export-sections-list' key='{this.props.sections}'>
                {this.state.sections}
              </div>
            </div>

            <div className='export-pdf-controls'>
              <button onClick={this.handleCancel}>Cancel</button>
              <button className='confirm' onClick={this.handleConfirm}>Confirm</button>
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

  public documentTitleActive = (): void => {
    PreviewForm.isTitle = true;
    this.calcLogic();
  };

  public documentTitleDeactive = (): void => {
    PreviewForm.isTitle = false;
    this.calcLogic();
  };

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
        targetElement.scrollIntoView({behavior: 'smooth'});
      }
    }
  };

  public calcLogic = (): void => {
    const divContainer = document.getElementById('holder');
    divContainer.innerHTML = '';
    const {editorView} = this.props;
    const data = editorView.dom.parentElement.parentElement;
    let data1 = this.cloneModifyNode(data);
    const prosimer_cls_element = data1.querySelector('.ProseMirror');
    prosimer_cls_element.setAttribute('contenteditable', 'false');
    prosimer_cls_element.classList.remove('czi-prosemirror-editor');
    prosimer_cls_element
      .querySelectorAll('.molm-czi-image-view-body-img-clip span')
      .forEach((span_) => {
        (span_ as HTMLElement).style.display = 'flex';
      });

    data1 = filterDocumentSections(
      data1,
      this.tocNodeList,
      this.state.sectionNodesToExclude,
      this.state.storedStyles
    );

    if (PreviewForm.isCitation) {
      const CitationIcons = data1.querySelectorAll('.citationnote');
      CitationIcons.forEach((CitationIcon, index) => {
        const superscript = document.createElement('sup');
        superscript.textContent = `[${index + 1}]`;
        CitationIcon.parentNode?.replaceChild(superscript, CitationIcon);
      });
      this.insertFooters(CitationIcons, data1);
    }

    if (PreviewForm.isToc && PreviewForm.isTitle) {
      const parentDiv = document.createElement('div');
      parentDiv.classList.add('titleHead');
      const header = document.createElement('h4');
      header.style.marginBottom = '40px';
      header.style.color = '#000000';
      header.textContent =
        editorView?.state?.doc?.attrs?.objectMetaData?.customEntity[
          'http://www.w3.org/2000/01/rdf-schema#label'
        ] || 'DEFAULT TITLE';

      const newDiv = document.createElement('div');
      newDiv.classList.add('tocHead');
      parentDiv.appendChild(header);
      parentDiv.appendChild(newDiv);
      data1.insertBefore(parentDiv, data1.firstChild);
    } else if (PreviewForm.isToc) {
      const newDiv = document.createElement('div');
      newDiv.classList.add('tocHead');
      data1.insertBefore(newDiv, data1.firstChild);
    } else if (PreviewForm.isTitle) {
      const parentDiv = document.createElement('div');
      parentDiv.classList.add('titleHead');
      const header = document.createElement('h4');
      header.style.marginBottom = '40px';
      header.style.color = '#000000';
      header.textContent =
        editorView?.state?.doc?.attrs?.objectMetaData?.customEntity[
          'http://www.w3.org/2000/01/rdf-schema#label'
        ] || 'DEFAULT TITLE';
      parentDiv.appendChild(header);
      data1.insertBefore(parentDiv, data1.firstChild);
    }

    const infoIcons = data1.querySelectorAll('.infoicon');
    infoIcons.forEach((infoIcon, index) => {
      const superscript = document.createElement('sup');
      superscript.textContent = (index + 1).toString();
      infoIcon.textContent = '';
      infoIcon.appendChild(superscript);
    });
    for (const element of data1.children) {
      const imageElements = element.querySelectorAll('img');
      for (const imageElement of imageElements) {
        // Replace the width attribute with the desired new width value (capped at 500px if original width is larger).
        this.replaceImageWidth(imageElement);
      }
    }
    const paged = new Previewer();
    this.showAlert();
    paged.preview(data1, [], divContainer).then((flow) => {
      const preview_container_ = document.querySelector('.export-pdf-modal');
      (preview_container_ as HTMLElement).style.visibility = 'visible';
      this.addLinkEventListeners();
      this._popUp.close();
    });
  };

  public tocActive = (): void => {
    PreviewForm.isToc = true;
    this.calcLogic();
  };

  public InfoActive = (): void => {
    this.calcLogic();
  };

  public Tocdeactive = (): void => {
    PreviewForm.isToc = false;
    this.calcLogic();
  };

  public handleCancel = (): void => {
    PreviewForm.isToc = false;
    PreviewForm.general = false;
    PreviewForm.isTitle = false;
    PreviewForm.isCitation = false;
    this.props.onClose();
  };

  public handleConfirm = (): void => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const divContainer = document.getElementById('holder');
      printWindow.document.open();
      printWindow.document.write(
        '<!DOCTYPE html><html><head><title>LICIT</title></head><body></body></html>'
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
          styleElement.setAttribute(attribute.name, attribute.value);
        }
      }
      const styleText = styles.join('\n');
      styleElement.textContent = styleText;
      doc.head.appendChild(styleElement);
    }
  };

  private renderTocList(structure: SectionNodeStructure[], isChildElement = false): void {
    for (const section of structure) {
      const uniqueSectionId = `licit-pdf-export-${section.id}`;
      const indentIncrement = 15;
      let indentAmount = '0';

      if (section.level > 1) {
        indentAmount = `${(section.level - 1) * indentIncrement}px`;
      }

      this.sectionListElements.push(
        <div key={section.id} style={{padding: '5px 10px', paddingLeft: indentAmount , display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', minWidth: '100%', width: 'auto'}}>
          <div>
            <input defaultChecked={true} id={uniqueSectionId} name="infoicon" onChange={() => this.updateDocumentSectionList(section.id)} style={{cursor: 'pointer'}} type="checkbox" value='on' />
            {' '}
          </div>

          <label htmlFor={uniqueSectionId} style={{cursor: 'pointer', marginLeft: '5px', textWrap: 'nowrap'}}>{section.title}</label>
        </div>
      );

      if (section.children.length) {
        this.renderTocList(section.children, true);
      }
    }

    if (!isChildElement) {
      this.setState((prevState) => {
        return({ ...prevState, sections: this.sectionListElements });
      });
    }
  }
}
