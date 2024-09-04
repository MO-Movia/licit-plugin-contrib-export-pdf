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
      () => {
        return null;
      },
      mockEditorView
    );
    expect(mockExportPDF.exportPdf).toHaveBeenCalledWith(mockEditorView);
    expect(result).toBe(true);
  });

  it('should wait for input', async () => {
    const command = new ExportPDFCommand();
    expect(
      await command.waitForUserInput(null as unknown as EditorState)
    ).toBeUndefined();
  });

  it('should not render label', () => {
    const command = new ExportPDFCommand();
    expect(command.renderLabel()).toBeNull();
  });

  it('should cancel', () => {
    const command = new ExportPDFCommand();
    expect(command.cancel()).toBeNull();
  });

  it('should be active', () => {
    const command = new ExportPDFCommand();
    expect(command.isActive()).toBeTruthy();
  });

  it('should not executeWithUserInput', () => {
    const command = new ExportPDFCommand();
    expect(
      command.executeWithUserInput(null as unknown as EditorState)
    ).toBeFalsy();
  });

  it('should execute custom', () => {
    const command = new ExportPDFCommand();
    expect(
      command.executeCustom(
        null as unknown as EditorState,
        null as unknown as Transform
      )
    ).toBeNull();
  });
});
