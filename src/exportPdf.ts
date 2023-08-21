import {EditorView} from 'prosemirror-view';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import moment from 'moment/moment';

// [FS] IRAD-1893 2022-07-25
// Export to PDF file.
export class ExportPDF {
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

    const data = this.getContainer(view);
    this.renderHTML(data, fileName);
    return true;
  }

  private async renderHTML(data: HTMLElement, fileName: string): Promise<void> {
    const canvas = await html2canvas(data, {
      height: 1000,
    });
    const jsPdf = new jsPDF('p', 'mm', [canvas?.width, canvas?.height]);
    jsPdf.html(data, {
      margin: [20, 0, 60, 0], // left
      callback: (pdf) => {
        this.onExport(pdf, fileName);
      },
    });
  }

  private onExport(pdf: jsPDF, fileName: string): void {
    const pages = pdf.getNumberOfPages();
    const pageWidth = pdf.internal.pageSize.width; //Optional
    const pageHeight = pdf.internal.pageSize.height; //Optional

    for (let j = 1; j < pages + 1; j++) {
      const horizontalPos = pageWidth / 2; //Can be fixed number
      const verticalPos = pageHeight - 10; //Can be fixed number
      pdf.setPage(j);
      pdf.text(`${j} of ${pages}`, horizontalPos, verticalPos, {
        align: 'center',
      });
    }

    pdf.save(fileName + '.pdf');
  }

  getContainer = (view: EditorView): HTMLElement => {
    // .czi-editor-frame-body-scroll
    const container = view.dom?.parentElement?.parentElement?.parentElement;
    const pluginEnabled =
      container?.querySelector('#commentPlugin')?.childElementCount > 0;
    if (pluginEnabled) {
      return view.dom;
    }

    return container;
  };
}
