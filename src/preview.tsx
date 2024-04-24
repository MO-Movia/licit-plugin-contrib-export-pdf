import React from 'react';
import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';
import { Previewer, registerHandlers } from 'pagedjs';
import MyHandler, { Array } from './handlers';
import jsPDF from 'jspdf';
import { display } from 'html2canvas/dist/types/css/property-descriptors/display';
// import './ui/paged.css';
export let Option = [];

interface Props {
  editorState: EditorState;
  editorView: EditorView;
  onClose: () => void;
}


class PreviewForm extends React.PureComponent<Props> {

  htmlString = '';
  paragraphNodeContent = [];
  dataTrial;

  componentDidMount(): void {
    if (Option.includes(2)) {
      let elementToRemove = 2;
      while (Option.indexOf(elementToRemove) !== -1) {
        let indexToRemove = Option.indexOf(elementToRemove);
        Option.splice(indexToRemove, 1);
      }
    }
    if (Option.includes(3)) {
      let elementToRemove = 3;
      while (Option.indexOf(elementToRemove) !== -1) {
        let indexToRemove = Option.indexOf(elementToRemove);
        Option.splice(indexToRemove, 1);
      }
    }
    Option.push(1);
    registerHandlers(MyHandler);
    const { editorView } = this.props;
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
    // const jsPdf = new jsPDF('p', 'mm', [1000, 1000]);
    // jsPdf.html(data1, {
    //   margin: [0, 0, 110, 0], // left
    //   callback: pdf => {
    //     this.onExport(pdf);
    //   },
    // });
  }

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

              </div>

              <div style={{ position: 'absolute', bottom: '0', right: '0', padding: '5px' }}>
                <button onClick={this.handleConfirm}>Confirm</button>
                <button onClick={this.handleCancel}>Cancel</button>
              </div>

            </div>
          </div>
          {/* <div style={{backgroundColor: 'darkgrey'}}>
            <button onClick={this.handleConfirm}>Confirm</button>
            <button onClick={this.handleCancel}>Cancel</button>
            <label style={{marginLeft: '10px'}}>
              <input
                type="checkbox"
                name="TOC"
                onChange={this.handleTOCChange}
              />{' '}
              Include TOC
            </label>
            <label style={{marginLeft: '10px'}}>
              <input
                type="checkbox"
                name="infoicon"
                onChange={this.handleInfoiconChange}
              />{' '}
              Convert Info Icons to Footnotes
            </label>
          </div> */}
        </div>
      </div>
    );
  }

  private onExport(pdf: jsPDF): void {
    pdf.save(1 + '.pdf');
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

  tocActive = (): void => {
    if (!Option.includes(2)) {
      Option.push(2);
    }
    let divContainer = document.getElementById('holder');
    divContainer.innerHTML = '';
    let newDiv = document.createElement('div');
    newDiv.classList.add('tocHead');
    newDiv.style.paddingBottom = '50px';
    const { editorView } = this.props;
    const data = this.getContainer(editorView);
    let data1 = data.cloneNode(true);
    data1.insertBefore(newDiv, data1.firstChild);
    if (Option.includes(3)) {
      var infoIcons = (data1 as HTMLElement).querySelectorAll('.infoicon');
      infoIcons.forEach((infoIcon, index) => {
        var superscript = document.createElement('sup');
        superscript.textContent = (index + 1).toString();
        infoIcon.textContent = '';
        infoIcon.appendChild(superscript);
      });
    }
    let paged = new Previewer();
    paged.preview(data1, [], divContainer).then(flow => {
      console.log('Rendered', flow.total, 'pages.');
    });
  };

  InfoActive = (): void => {
    if (!Option.includes(3)) {
      Option.push(3);
    }
    let divContainer = document.getElementById('holder');
    divContainer.innerHTML = '';
    const { editorView } = this.props;
    const data = this.getContainer(editorView);
    let data1 = data.cloneNode(true);
    var infoIcons = (data1 as HTMLElement).querySelectorAll('.infoicon');
    infoIcons.forEach((infoIcon, index) => {
      var superscript = document.createElement('sup');
      superscript.textContent = (index + 1).toString();
      infoIcon.textContent = '';
      infoIcon.appendChild(superscript);
    });
    if (Option.includes(2)) {
      let newDiv = document.createElement('div');
      newDiv.classList.add('tocHead');
      data1.insertBefore(newDiv, data1.firstChild);
    }
    let paged = new Previewer();
    paged.preview(data1, [], divContainer).then(flow => {
      console.log('Rendered', flow.total, 'pages.');
    });
  };

  InfoDeactive = (): void => {
    let elementToRemove = 3;
    while (Option.indexOf(elementToRemove) !== -1) {
      let indexToRemove = Option.indexOf(elementToRemove);
      Option.splice(indexToRemove, 1);
    }
    if (Option.includes(2)) {
      this.tocActive();
    } else {
      this.original();
    }
  };

  original = (): void => {
    const { editorView } = this.props;
    let divContainer = document.getElementById('holder');
    divContainer.innerHTML = '';
    const data = this.getContainer(editorView);
    let data1 = data.cloneNode(true);
    let paged = new Previewer();
    paged.preview(data1, [], divContainer).then(flow => {
      console.log('Rendered', flow.total, 'pages.');
      for (let i = 0; i < flow.paged; i++) {
        this.htmlString += flow.paged[i];
      }
    });
  };

  Tocdeactive = (): void => {
    let elementToRemove = 2;
    while (Option.indexOf(elementToRemove) !== -1) {
      let indexToRemove = Option.indexOf(elementToRemove);
      Option.splice(indexToRemove, 1);
    }
    if (Option.includes(3)) {
      this.InfoActive();
    } else {
      this.original();
    }
  };

  handleCancel = (): void => {
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
    // .czi-editor-frame-body-scroll
    let comments = false;
    let container;
    // let container = view.dom.parentElement.parentElement.parentElement;
    // if (null != container) {
    //   const pluginEnabled = container.querySelector('#commentPlugin');
    //   if (null != pluginEnabled) {
    //     if (0 < (pluginEnabled as HTMLElement).childElementCount) {
    //       comments = true;
    //     }
    //   }
    // }

    if (!comments) {
      container = view.dom.parentElement.parentElement;
    }
    return container;
  };
}

export default PreviewForm;
