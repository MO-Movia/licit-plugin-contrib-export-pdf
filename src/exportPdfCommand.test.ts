import {ExportPDFCommand} from './exportPdfCommand';
import {EditorState} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';

describe('Export PDF Command', () => {
 

  it('isEnabled returns true', () => {
    const exportPDFCommand = new ExportPDFCommand();
    const result = exportPDFCommand.isEnabled();
    expect(result).toBe(true);
  });

});
