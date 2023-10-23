import { ExportPDFCommand } from './exportPdfCommand';
import { EditorState } from 'prosemirror-state';
import { Transform } from 'prosemirror-transform';
import { EditorView } from 'prosemirror-view';
import { ExportPDF } from './exportPdf';

describe('Export PDF Command', () => {
  it('isEnabled returns true', () => {
    const exportPDFCommand = new ExportPDFCommand();
    const result = exportPDFCommand.isEnabled();
    expect(result).toBe(true);
  });

  it('executes exportPdf method with the correct argument and returns its result', () => {
    const exportPDFCommand = new ExportPDFCommand();
    const mockExportPDF = new ExportPDF();
    mockExportPDF.exportPdf = jest.fn().mockReturnValue(true);
    exportPDFCommand.exportPdf = mockExportPDF;
    const mockEditorState = {} as EditorState;
    const mockEditorView = {} as EditorView;
    const result = exportPDFCommand.execute(
      mockEditorState,
      (_tr: Transform) => { return null; },
      mockEditorView
    );
    expect(mockExportPDF.exportPdf).toHaveBeenCalledWith(mockEditorView);
    expect(result).toBe(true);
  });
});
