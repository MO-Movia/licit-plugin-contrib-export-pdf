import {ExportPDFPlugin} from './ExportPDFPlugin';
import {createEditor, doc, p, schema} from 'jest-prosemirror';
import moment from 'moment';
import {Schema} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';
import {EditorState} from 'prosemirror-state';
import {ExportPDF} from './exportPdf';

jest.mock('html2canvas', () => {
  return jest.fn().mockResolvedValue(null);
});
jest.mock('jspdf', () => {
  const mockSave = jest.fn();
  const mockHtml = jest.fn();

  const mockConstructor = jest.fn().mockImplementation(() => ({
    save: mockSave,
    html: mockHtml,
  }));

  return mockConstructor;
});
describe('Export PDF Plugin', () => {
  let plugin;

  beforeEach(() => {
    plugin = new ExportPDFPlugin(false);
  });

  it('should handle export to pdf', () => {
    const editor = createEditor(doc('<cursor>', p('Hello World')), {
      plugins: [plugin],
    });
    editor.shortcut('Ctrl-Alt-P');
    moment().format('YYYY-MM-DD_HH:mm:ss');
  });

  it('should call initKeyCommands', () => {
    const initReturn = plugin.initKeyCommands();
    expect(initReturn).not.toBeNull();
  });

  it('should call initButtonCommands', () => {
    const btnCommand = plugin.initButtonCommands();
    expect(btnCommand).not.toBeNull();
  });

  it('should call initButtonCommands if the show button is false', () => {
    plugin.showButton = true;
    const btnCommand = plugin.initButtonCommands();
    expect(btnCommand).not.toBeNull();
  });

 
});
