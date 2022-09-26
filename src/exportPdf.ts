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
   * @returns void
   */
  exportPdf(view: EditorView): void {
    const objectId = view.state.doc.attrs['objectId'];
    let fileName = '';
    const time = moment().format('YYYY-MM-DD_HH:mm:ss');
    if (null != objectId) {
      fileName = objectId.split('/').pop() + '-' + time;
    } else {
      fileName = time;
    }

    const data = view.dom;
    html2canvas(data, {
      height: 1000,
    }).then((canvas) => {
      const jsPdf = new jsPDF('p', 'mm', [canvas.width, canvas.height]);
      jsPdf.html(data, {
        margin: [20, 0, 60, 0], // left
        callback: function (pdf) {
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
        },
      });
    });
  }
}