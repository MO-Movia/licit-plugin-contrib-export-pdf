import React from 'react';
import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';
import { Previewer, registerHandlers } from 'pagedjs';
import { MyHandler, Array } from './handlers';

interface Props {
  editorState: EditorState;
  editorView: EditorView;
  onClose: () => void;
}

export class PreviewForm extends React.PureComponent<Props> {
  static general = false;
  static isToc = false;
  static isInfoicon = false;
  static tocHeader = [];
  static isCitation = false;
  static isTitle = false;
  constructor(props: Props) {
    super(props);
  }

  htmlString = '';
  paragraphNodeContent = [];
  dataTrial;

  componentDidMount(): void {
    const { editorView } = this.props;
    this.getToc(editorView)
    PreviewForm.general = true;
    registerHandlers(MyHandler);
    let divContainer = document.getElementById('holder');
    const data = this.getContainer(editorView);
    let data1 = data.cloneNode(true);
    console.log(Array);
    let paged = new Previewer();
    paged.preview(data1, [], divContainer).then(flow => {
      console.log('Rendered', flow.total, 'pages.');
      for (let i = 0; i < flow.paged; i++) {
        this.htmlString += flow.paged[i];
      }
    });

  }
  getToc = async (view) => {
    let storeTOCvalue = [];
    const stylePromise = view.runtime;
    const prototype = Object.getPrototypeOf(stylePromise);
    const styles = await prototype.getStylesAsync();

    storeTOCvalue = styles
      .filter((style) => style.styles.toc === true)
      .map((style) => style.styleName);

    view?.state?.tr?.doc.descendants((node) => {
      if (node.attrs.styleName) {
        for (let i = 0; i < storeTOCvalue.length; i++) {
          if (storeTOCvalue[i] === node.attrs.styleName) {
            PreviewForm.tocHeader.push(node.attrs.styleName);
          }
        }
      }
    });
  };



  render(): React.ReactElement<any> {
    const { editorView } = this.props;
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
                      onChange={this.handleInfoiconChange}
                    />{' '}
                    Convert Info Icons to Footnotes
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
  handleInfoiconChange = event => {
    if (event.target.checked) {
      this.InfoActive();
    } else {
      this.InfoDeactive();
    }
  };

  getView_() {
    const { editorView } = this.props;
    return editorView;
  }

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
    const selector = trialHtml.querySelector(
      '.ProseMirror.czi-prosemirror-editor'
    );
    for (let i = 0; i < 10; i++) {
      const blankDiv = document.createElement('div');
      selector.appendChild(blankDiv);
      const nbsp = document.createTextNode('\u00A0');
      selector.appendChild(nbsp);
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
      // const cleanedDescription = description.replace(/<[^>]*>/g, '');
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


    if (PreviewForm.isCitation) {
      var CitationIcons = (data1 as HTMLElement).querySelectorAll('.citationnote');
      CitationIcons.forEach((CitationIcon, index) => {
        var superscript = document.createElement('sup');
        superscript.textContent = `[${index + 1}]`;
        CitationIcon.parentNode?.replaceChild(superscript, CitationIcon);
      });
      this.insertFooters(CitationIcons, data1);
    }


    if (PreviewForm.isInfoicon) {
      var infoIcons = (data1 as HTMLElement).querySelectorAll('.infoicon');
      infoIcons.forEach((infoIcon, index) => {
        var superscript = document.createElement('sup');
        superscript.textContent = (index + 1).toString();
        infoIcon.textContent = '';
        infoIcon.appendChild(superscript);
      });
    }


    if (PreviewForm.isToc && PreviewForm.isTitle) {
      let parentDiv = document.createElement('div');
      parentDiv.style.paddingBottom = '50px';
      let header = document.createElement('h3');
      header.textContent = this.props.editorView.state.doc.attrs.gg || 'Document Title';

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
      header.textContent = this.props.editorView.state.doc.attrs.gg || 'Document Title';
      parentDiv.appendChild(header);
      data1.insertBefore(parentDiv, data1.firstChild);
    }

    let paged = new Previewer();
    paged.preview(data1, [], divContainer).then(flow => {
      console.log('Rendered', flow.total, 'pages.');
    });
  }



  tocActive = (): void => {
    PreviewForm.isToc = true;
    this.calcLogic();

  };

  InfoActive = (): void => {
    PreviewForm.isInfoicon = true;
    this.calcLogic();

  };

  InfoDeactive = (): void => {

    PreviewForm.isInfoicon = false;
    this.calcLogic();
  };


  Tocdeactive = (): void => {

    PreviewForm.isToc = false;
    this.calcLogic();
  };

  handleCancel = (): void => {
    PreviewForm.isInfoicon = false;
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

      for (let i = 0; i < divContainer.childNodes.length; i++) {
        printWindow.document.documentElement.appendChild(
          divContainer.childNodes[i].cloneNode(true)
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

  // Function to get all CSS rules from current window
  prepareCSSRules = (doc): void => {
    const sheets = document.styleSheets;
    for (let i = 0; i < sheets.length; i++) {
      const rules = sheets[i].cssRules;
      const styles = [];
      const styleElement = doc.createElement('style') as HTMLElement;
      for (let j = 0; j < rules.length; j++) {
        styles.push(rules[j].cssText);
        const attributes = (sheets[i].ownerNode as HTMLElement).attributes;
        for (let k = 0; k < attributes.length; k++) {
          styleElement.setAttribute(attributes[k].name, attributes[k].value);
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

