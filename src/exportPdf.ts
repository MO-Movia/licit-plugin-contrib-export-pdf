import {EditorView} from 'prosemirror-view';
import moment from 'moment/moment';
import {createPopUp} from '@modusoperandi/licit-ui-commands';
import {PreviewForm} from './preview';

// [FS] IRAD-1893 2022-07-25
// Export to PDF file.
export class ExportPDF {
  _popUp = null;
  /**
   * Export content to pdf and save locally.
   * @param  {EditorView} view
   * @returns boolean
   */
  exportPdf(view: EditorView): boolean {
    const objectId = view.state.doc.attrs['objectId'];
    let fileName = '';
    const time = moment().format('YYYY-MM-DD_HH:mm:ss');
    if (null != objectId) {
      fileName = objectId.split('/').pop() + '-' + time;
    } else {
      fileName = time;
    }

    const viewPops = {
      editorState: view.state,
      editorView: view,
      onClose: () => {
        if (this._popUp) {
          this._popUp.close();
          this._popUp = null;
        }
      },
    };
    this._popUp = createPopUp(PreviewForm, viewPops, {
      autoDismiss: false,
      modal: false,
      anchor: view.dom.parentElement,
    });

    return true;
  }
}

export function createToc(config) {
  const content1 = config.content;
  const tocElement1 = config.tocElement;
  const titleElements1 = config.titleElements;
  let tocElementDiv = content1.querySelector(`${tocElement1}`);
  if (!content1.querySelector(`#list-toc-generated`)) {
    let tocUl = document.createElement('ul');
    tocUl.id = 'list-toc-generated';
    tocElementDiv.appendChild(tocUl);

    let tocElementNbr = 0;
    for (var i = 0; i < titleElements1.length; i++) {
      let titleHierarchy = i + 1;
      let titleElement = content1.querySelectorAll(
        `p[stylename="${titleElements1[i]}"]`
      );
      titleElement.forEach(function(element) {
        // add classes to the element
        element.classList.add('title-element');
        element.setAttribute('data-title-level', titleHierarchy.toString());

        // add id if doesn't exist
        tocElementNbr++;
        let idElement = element.id;
        if (idElement == '') {
          element.id = 'title-element-' + tocElementNbr;
        }
      });
    }
    let tocElements = content1.querySelectorAll('.title-element');

    for (var i = 0; i < tocElements.length; i++) {
      let tocElement = tocElements[i];

      let tocNewLi = document.createElement('li');

      // Add class for the hierarcy of toc
      tocNewLi.classList.add('toc-element');

      // Create the element
      tocNewLi.innerHTML =
        '<a href="#' + tocElement.id + '">' + tocElement.innerHTML + '</a>';
      tocUl.appendChild(tocNewLi);
    }
  }
}
