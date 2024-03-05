import React from 'react';
import {EditorView} from 'prosemirror-view';
import {EditorState} from 'prosemirror-state';
import {Previewer, registerHandlers} from 'pagedjs';
import MyHandler, {Array} from './handlers';
import jsPDF from 'jspdf';
// import './ui/paged.css';
export let Option = [];

class PreviewForm extends React.Component {
  htmlString = '';
  paragraphNodeContent = [];
  dataTrial;
  props: {
    editorState: EditorState;
    editorView: EditorView;
    onClose(): void;
  };

  componentDidMount(): void {
    Option.push(1);
    registerHandlers(MyHandler);
    const {editorView} = this.props;
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
    const {editorView} = this.props;
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
        <div style={{border: 'solid'}}>
          <div
            id="holder"
            className="preview-container"
            style={{
              height: '90vh',
              width: 'auto',
              overflowY: 'auto',
            }}
          ></div>

          <div style={{backgroundColor: 'darkgrey'}}>
            <button onClick={this.handleConfirm}>Confirm</button>
            <button onClick={this.handleCancel}>Cancel</button>
            <label style={{marginLeft: '10px'}}>
              <input
                type="checkbox"
                name="TOC"
                onChange={this.handleTOCChange}
              />{' '}
              TOC
            </label>
            <label style={{marginLeft: '10px'}}>
              <input
                type="checkbox"
                name="infoicon"
                onChange={this.handleInfoiconChange}
              />{' '}
              Infoicon
            </label>
          </div>
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
    const {editorView} = this.props;
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
    const {editorView} = this.props;
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
    const {editorView} = this.props;
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
    let divContainer = document.getElementById('holder');
    let html = divContainer.innerHTML;
    let scriptElement = printWindow.document.createElement('script');
    scriptElement.src = 'https://unpkg.com/pagedjs/dist/paged.polyfill.js';
    printWindow.document.head.appendChild(scriptElement);
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
    this.props.onClose();
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
