import React from 'react';
import { EditorView } from 'prosemirror-view';
import { Previewer, registerHandlers } from 'pagedjs';
import { MyHandler } from './handlers';
import { createPopUp, atViewportCenter } from '@modusoperandi/licit-ui-commands';
import { Loader } from './loader';

interface Props {
  editorView: EditorView;
  onClose: () => void;
}

export class PreviewForm extends React.PureComponent<Props> {
  public static general: boolean = false; //NOSONAR need to reassign this variable , so can't be readonly
  public static isToc: boolean = false; //NOSONAR need to reassign this variable , so can't be readonly
  public static isCitation: boolean = false;//NOSONAR need to reassign this variable , so can't be readonly
  public static isTitle: boolean = false;//NOSONAR need to reassign this variable , so can't be readonly
  public static tocHeader = [];//NOSONAR need to reassign this variable , so can't be readonly
  _popUp = null;

  componentDidMount(): void {
    const { editorView } = this.props;
    this.getToc(editorView)
    PreviewForm.general = true;
    registerHandlers(MyHandler);
    let divContainer = document.getElementById('holder');
    const data = this.getContainer(editorView);
    let data1 = data.cloneNode(true) as HTMLElement;
    let infoIcons = data1.querySelectorAll('.infoicon');
    infoIcons.forEach((infoIcon, index) => {
      let superscript = document.createElement('sup');
      superscript.textContent = (index + 1).toString();
      infoIcon.textContent = '';
      infoIcon.appendChild(superscript);
    });
    let prosimer_cls_element = data1.querySelector('.ProseMirror');
    prosimer_cls_element.setAttribute('contenteditable', 'false')
    let paged = new Previewer();
    paged.preview(data1, [], divContainer).then(flow => {
      console.log('Rendered', flow.total, 'pages.');
      this.InfoActive();
    });
  }

  showAlert() {
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

  getToc = async (view) => {
    let storeTOCvalue = [];
    const stylePromise = view.runtime;
    const styles = await stylePromise.getStylesAsync();
    storeTOCvalue = styles
      .filter((style) => style.styles.toc === true)
      .map((style) => style.styleName);

    view?.state?.tr?.doc.descendants((node) => {
      if (node.attrs.styleName) {
        for (const tocValue of storeTOCvalue) {
          if (tocValue === node.attrs.styleName) {
            PreviewForm.tocHeader.push(node.attrs.styleName);
          }
        }

      }
    });
  };

  render(): React.ReactElement<any> {
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
        <div style={{ border: 'solid' }}>
          <div
            style={{ display: 'flex', flexDirection: 'row' }}>

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
              style={{ height: '90vh', background: 'rgb(226 226 226)', position: 'relative' }}
            >
              <div style={{ padding: '20px' }}>
                <span>Options:</span>
                <div style={{ marginTop: '10px' }}>
                  <label >
                    <input
                      type="checkbox"
                      name="TOC"
                      onChange={this.handleTOCChange}
                    />{' '}
                    Include TOC
                  </label>
                </div>
          
                <div style={{ marginTop: '10px' }}>
                  <label >
                    <input
                      type="checkbox"
                      name="infoicon"
                      onChange={this.handelDocumentTitle}
                    />{' '}
                    Document title
                  </label>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <label >
                    <input
                      type="checkbox"
                      name="infoicon"
                      onChange={this.handelCitation}
                    />{' '}
                    Citation
                  </label>
                </div>


              </div>

              <div style={{ position: 'absolute', bottom: '0', right: '0', padding: '5px' }}>
                <button onClick={this.handleConfirm}>Confirm</button>
                <button onClick={this.handleCancel}>Cancel</button>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }
  handelDocumentTitle = event => {
    if (event.target.checked) {
      this.documentTitleActive();
    } else {
      this.documentTitleDeactive();
    }
  }

  handelCitation = event => {
    if (event.target.checked) {
      this.citationActive()
    } else {
      this.citationDeactive();
    }
  }

  handleTOCChange = event => {
    if (event.target.checked) {
      this.tocActive();
    } else {
      this.Tocdeactive();
    }
  };

  documentTitleActive = (): void => {
    PreviewForm.isTitle = true;
    this.calcLogic();
  }

  documentTitleDeactive = (): void => {
    PreviewForm.isTitle = false;
    this.calcLogic();
  }

  citationActive = (): void => {
    PreviewForm.isCitation = true;
    this.calcLogic();


  }

  insertFooters = (CitationIcons, trialHtml): void => {
    const selector = trialHtml.querySelector('.ProseMirror.czi-prosemirror-editor');
    if (CitationIcons.length > 0) {
      for (let i = 0; i < 10; i++) {
        if (i === 6) {
          const citation_header = document.createElement('h4');
          citation_header.textContent = 'Endnotes';
          citation_header.style.color = 'blue';
          selector.appendChild(citation_header)
        } else if (i === 7) {
          const underline = document.createElement('div');
          underline.style.width = '200px'
          underline.style.height = '1.5px';
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

  citationDeactive = (): void => {
    PreviewForm.isCitation = false;
    this.calcLogic();
  }
  cloneModifyNode = (data: HTMLElement) => {
    return data.cloneNode(true) as HTMLElement;
  }

  calcLogic = (): void => {
    let divContainer = document.getElementById('holder');
    divContainer.innerHTML = '';
    const { editorView } = this.props;
    const data = this.getContainer(editorView);
    let data1 = this.cloneModifyNode(data);
    let prosimer_cls_element = data1.querySelector('.ProseMirror');
    prosimer_cls_element.setAttribute('contenteditable', 'false')
    if (PreviewForm.isCitation) {
      let CitationIcons = data1.querySelectorAll('.citationnote');
      CitationIcons.forEach((CitationIcon, index) => {
        let superscript = document.createElement('sup');
        superscript.textContent = `[${index + 1}]`;
        CitationIcon.parentNode?.replaceChild(superscript, CitationIcon);
      });
      this.insertFooters(CitationIcons, data1);
    }
    if (PreviewForm.isToc && PreviewForm.isTitle) {
      let parentDiv = document.createElement('div');
      parentDiv.style.paddingBottom = '50px';
      let header = document.createElement('h3');
      header.textContent = editorView?.state?.doc?.attrs?.objectMetaData?.customEntity[
        'http://www.w3.org/2000/01/rdf-schema#label'
      ] || 'DEFAULT TITLE';

      let newDiv = document.createElement('div');
      newDiv.classList.add('tocHead');

      parentDiv.appendChild(header);
      parentDiv.appendChild(newDiv);
      data1.insertBefore(parentDiv, data1.firstChild);

    } else if (PreviewForm.isToc) {
      let newDiv = document.createElement('div');
      newDiv.classList.add('tocHead');
      data1.insertBefore(newDiv, data1.firstChild);
    } else if (PreviewForm.isTitle) {
      let parentDiv = document.createElement('div');
      parentDiv.style.paddingBottom = '50px';
      let header = document.createElement('h3');
      header.textContent = editorView?.state?.doc?.attrs?.objectMetaData?.customEntity[
        'http://www.w3.org/2000/01/rdf-schema#label'
      ] || 'DEFAULT TITLE';;
      parentDiv.appendChild(header);
      data1.insertBefore(parentDiv, data1.firstChild);
    }
    let infoIcons = data1.querySelectorAll('.infoicon');
    infoIcons.forEach((infoIcon, index) => {
      let superscript = document.createElement('sup');
      superscript.textContent = (index + 1).toString();
      infoIcon.textContent = '';
      infoIcon.appendChild(superscript);
    });
    let paged = new Previewer();
    this.showAlert();
    paged.preview(data1, [], divContainer).then(flow => {
      this._popUp.close();
      console.log('Rendered', flow.total, 'pages.');
    });
  }

  tocActive = (): void => {
    PreviewForm.isToc = true;
    this.calcLogic();

  };

  InfoActive = (): void => {
    this.calcLogic();
  };


  Tocdeactive = (): void => {

    PreviewForm.isToc = false;
    this.calcLogic();
  };

  handleCancel = (): void => {
    PreviewForm.isToc = false;
    PreviewForm.general = false;
    PreviewForm.isTitle = false;
    PreviewForm.isCitation = false;
    this.props.onClose();
  };

  handleConfirm = (): void => {
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
    this.props.onClose();
  };
  prepareCSSRules = (doc): void => {
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


  getContainer = (view): HTMLElement => {
    let comments = false;
    let container;
    if (!comments) {
      container = view.dom.parentElement.parentElement;
    }
    return container;
  };
}

