import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';
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
  public exportPdf(view: EditorView, doc: unknown): boolean {
    const originalState = view.state;
    const newDoc = view.state?.schema.nodeFromJSON(doc);

    const fullDocState = EditorState.create({
      doc: newDoc,
      schema: originalState.schema,
      plugins: originalState.plugins,
    });
    document.body.classList.add('export-pdf-mode');
    view.updateState(fullDocState);
    const viewPops = {
      editorState: fullDocState,
      editorView: view,
      onClose: (): void => {
        if (this._popUp) {
          this._popUp.close();
          this._popUp = null;
          document.body.classList.remove('export-pdf-mode');
          view.updateState(originalState);
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


export function createTable(config): void {
  const {
    content,
    tocElement,
    tofElement,
    totElement,
    titleElements,
    titleElementsTOF,
    titleElementsTOT,
  } = config;

  generateList({
    content,
    containerSelector: tocElement,
    titleElements,
    cssClass: 'title-element',
    idPrefix: 'title-element',
    dataAttr: 'data-title-level',
    generatedListId: 'list-toc-generated',
    elementClass: 'toc-element',
  });

  generateList({
    content,
    containerSelector: tofElement,
    titleElements: titleElementsTOF,
    cssClass: 'title-element-tof',
    idPrefix: 'title-element-tof',
    dataAttr: 'data-title-level-tof',
    generatedListId: 'list-tof-generated',
    elementClass: 'tof-element',
  });

  generateList({
    content,
    containerSelector: totElement,
    titleElements: titleElementsTOT,
    cssClass: 'title-element-tot',
    idPrefix: 'title-element-tot',
    dataAttr: 'data-title-level-tot',
    generatedListId: 'list-tot-generated',
    elementClass: 'tot-element',
  });
}


function generateList({
  content,
  containerSelector,
  titleElements,
  cssClass,
  idPrefix,
  dataAttr,
  generatedListId,
  elementClass,
}) {
  const container = content.querySelector(containerSelector);
  if (!container || content.querySelector(`#${generatedListId}`)) return;

  const listDiv = document.createElement('div');
  listDiv.id = generatedListId;
  container.appendChild(listDiv);

  let elementCount = 0;

  titleElements.forEach((styleName, i) => {
    const titleHierarchy = i + 1;
    const elements = content.querySelectorAll(
      `p[stylename="${styleName}"], h4[stylename="${styleName}"]`
    );

    elements.forEach((el) => {
      el.classList.add(cssClass);
      el.setAttribute(dataAttr, titleHierarchy.toString());

      if (!el.id) {
        elementCount++;
        el.id = `${idPrefix}-${elementCount}`;
      }
    });
  });

  const allElements = content.querySelectorAll(`.${cssClass}`);

  allElements.forEach((el) => {
    const newEntry = document.createElement('p');
    newEntry.classList.add(elementClass);

    let text = el.textContent.trim();
    if (text.length > 70) {
      text = text.substring(0, 70);
      text = text.substring(0, text.lastIndexOf(' '));
    }

    newEntry.innerHTML = `<a href="#${el.id}">${text}</a>`;
    listDiv.appendChild(newEntry);
  });
}
