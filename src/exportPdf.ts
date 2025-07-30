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
    headerText: 'TABLE OF CONTENTS',
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
    headerText: 'TABLE OF FIGURES',
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
    headerText: 'TABLE OF TABLES',
  });
}


function escapeCSSId(id: string): string {
  return CSS?.escape
    ? CSS.escape(id)
    : id.replace(/^[0-9]/, '_$&').replace(/[^a-zA-Z0-9\-_:.]/g, '_');
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
  headerText,
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

  allElements.forEach((el, index) => {
    const safeId = escapeCSSId(el.id);

    let text = el.textContent.trim();
    if (text.length > 70) {
      text = text.substring(0, 70);
      text = text.substring(0, text.lastIndexOf(' '));
    }

    if (index === 0 && headerText) {
      // ✅ Create a styled <h4> header
      const headerEl = document.createElement('h4');
      headerEl.textContent = headerText;
      headerEl.style.marginBottom = '40px';
      headerEl.style.color = '#000000';
      listDiv.appendChild(headerEl);
    }

    const linkPara = document.createElement('p');
    linkPara.classList.add(elementClass);
    linkPara.innerHTML = `<a href="#${safeId}">${text}</a>`;
    listDiv.appendChild(linkPara);
  });
}