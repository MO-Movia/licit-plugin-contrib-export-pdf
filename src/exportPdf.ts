import { EditorView } from 'prosemirror-view';
import { createPopUp } from '@modusoperandi/licit-ui-commands';
import { PreviewForm } from './preview';

// [FS] IRAD-1893 2022-07-25
// Export to PDF file.
export class ExportPDF {
  private _popUp = null;
  /**
   * Export content to pdf and save locally.
   * @param  {EditorView} view
   * @returns boolean
   */
  public exportPdf(view: EditorView): boolean {
    document.body.classList.add('export-pdf-mode');
    const viewPops = {
      editorState: view.state,
      editorView: view,
      onClose: (): void => {
        if (this._popUp) {
          this._popUp.close();
          this._popUp = null;
          document.body.classList.remove('export-pdf-mode');
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

export function createToc(config): void {
  const content1 = config.content;
  const tocElement1 = config.tocElement;
  const titleElements1 = config.titleElements;
  const tocElementDiv = content1.querySelector(`${tocElement1}`);

  if (!content1.querySelector('#list-toc-generated')) {
    const tocUl = document.createElement('div');
    tocUl.id = 'list-toc-generated';
    tocElementDiv.appendChild(tocUl);
    let tocElementNbr = 0;

    for (let i = 0; i < titleElements1.length; i++) {
      const titleHierarchy = i + 1;
      const titleElement = content1.querySelectorAll(
        `p[stylename="${titleElements1[i]}"], h4[stylename="${titleElements1[i]}"]`
      );
      titleElement.forEach((element) => {
        // add classes to the element
        element.classList.add('title-element');
        element.setAttribute('data-title-level', titleHierarchy.toString());

        // add id if doesn't exist
        tocElementNbr++;
        const idElement = element.id;
        if (idElement == '') {
          element.id = 'title-element-' + tocElementNbr;
        }
      });
    }

    const tocElements = content1.querySelectorAll('.title-element');

    for (const tocElement of tocElements) {
      const tocNewLi = document.createElement('p');

      // Add class for the hierarchy of toc
      tocNewLi.classList.add('toc-element');
      let truncateText = tocElement.textContent;
      if (truncateText.length > 70) {
        truncateText = truncateText.substring(0, 70).trim();
        truncateText = truncateText.substring(0, truncateText.lastIndexOf(' '));
      }
      // Create the element
      tocNewLi.innerHTML =
        '<a href="#' + tocElement.id + '">' + truncateText + '</a>';
      tocUl.appendChild(tocNewLi);
    }
  }
}
