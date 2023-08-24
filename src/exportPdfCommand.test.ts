import {ExportPDFCommand} from './exportPdfCommand';
import {EditorState} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';

describe('Export PDF Command', () => {
  it('calls exportPdf with the correct view', () => {
    const exportPdfMock = {
      exportPdf: jest.fn(),
      getContainer: jest.fn(),
    };
    const exportPDFCommand = new ExportPDFCommand();
    exportPDFCommand.exportPdf = exportPdfMock;

    const editorStateMock = {} as EditorState;
    const editorViewMock = {} as EditorView;

    exportPDFCommand.execute(editorStateMock, jest.fn(), editorViewMock);
    expect(exportPdfMock.exportPdf).toHaveBeenCalledWith(editorViewMock);
  });

  it('isEnabled returns true', () => {
    const exportPDFCommand = new ExportPDFCommand();
    const result = exportPDFCommand.isEnabled();
    expect(result).toBe(true);
  });

});
