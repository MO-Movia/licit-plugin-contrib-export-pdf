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

  it('should return effective schema', () => {
    const originalSchema = new Schema({
      nodes: schema.spec.nodes,
      marks: schema.spec.marks,
    });
    const effSche = plugin.getEffectiveSchema(originalSchema);
    expect(originalSchema).toEqual(effSche);
  });

  it('should call initKeyCommands', () => {
    const initReturn = plugin.initKeyCommands();
    expect(initReturn).not.toBeNull();
  });

  it('should call initButtonCommands', () => {
    const btnCommand = plugin.initButtonCommands();
    expect(btnCommand).not.toBeNull();
  });

  it('should execute EXPORT_PDF with the view parameters', () => {
    const executeMock = jest.fn();
    const exportp = new ExportPDF();
    const exportPdfMock = jest.fn();
    const mySchema = new Schema({
      nodes: schema.spec.nodes,
      marks: schema.spec.marks,
    });
    const parent = document.createElement('div');
    parent.id = 'parant';
    const second = document.createElement('div');
    second.id = 'secondId';
    parent.appendChild(second);
    const third = document.createElement('div');
    third.id = 'thirdId';
    second.appendChild(third);
    const dom = document.createElement('div');
    dom.id = 'thirdId';
    third.appendChild(dom);
    const effSchema = plugin.getEffectiveSchema(mySchema);
    const state = EditorState.create({
      doc: doc('<p>', p('Hello World')),
      schema: effSchema,
    });
    const view = new EditorView(
      {mount: dom},
      {
        state: state,
      }
    );
    jest.spyOn(exportp, 'exportPdf').mockImplementation(exportPdfMock);
    plugin.perform(view);
    expect(executeMock).not.toHaveBeenCalledWith(undefined, undefined, view);

  });

  it('should call initButtonCommands if the show button is false', () => {
    plugin.showButton = true;
    const btnCommand = plugin.initButtonCommands();
    expect(btnCommand).not.toBeNull();
  });

  it('should get schema', () => {
    const originalSchema = new Schema({
      nodes: schema.spec.nodes,
      marks: schema.spec.marks,
    });
    const effSche = plugin.getEffectiveSchema(originalSchema);
    expect(originalSchema).toEqual(effSche);
  });

});
