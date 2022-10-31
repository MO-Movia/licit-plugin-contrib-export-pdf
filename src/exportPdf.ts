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

    console.info('Exporting PDF started.');

    const data = this.getContainer(view);
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
          console.info('Exporting PDF finished.');
        },
        html2canvas: {
          logging: false,
        },
      });
    });
  }

  getContainer = (view): HTMLElement => {
    // .czi-editor-frame-body-scroll
    let comments = false;
    let container = view.dom.parentElement.parentElement.parentElement;
    if (null != container) {
      const pluginEnabled = container.querySelector('#commentPlugin');
      if (null != pluginEnabled) {
        if (0 < (pluginEnabled as HTMLElement).childElementCount) {
          comments = true;
        }
      }
    }

    if (!comments) {
      container = view.dom;
    }
    return container;
  };
}