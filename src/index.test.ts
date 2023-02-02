import {ExportPDFPlugin} from './index';
import {createEditor, doc, p} from 'jest-prosemirror';
import moment from 'moment';

describe('ExportPDFPlugin', () => {
  const plugin = new ExportPDFPlugin(false);
  it('should handle export to pdf', () => {
    const editor = createEditor(doc(p('<cursor>')), {
      plugins: [plugin],
    });
    editor.shortcut('Ctrl-Alt-P');
    moment().format('YYYY-MM-DD_HH:mm:ss');
  });
});
