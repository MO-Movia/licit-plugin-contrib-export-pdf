import {ExportPDFCommand} from './exportPdfCommand';

describe('Export PDF Command', () => {
  it('isEnabled returns true', () => {
    const exportPDFCommand = new ExportPDFCommand();
    const result = exportPDFCommand.isEnabled();
    expect(result).toBe(true);
  });
});
