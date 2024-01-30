import {ExportPDFPlugin} from './ExportPDFPlugin';
import {createEditor, doc, p} from 'jest-prosemirror';
import moment from 'moment';
import {Schema} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';

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
  let plugin: ExportPDFPlugin;

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

  it('should return schema', () => {
    const schema = {} as unknown as Schema;
    expect(plugin.getEffectiveSchema(schema)).toBe(schema);
  });
  it('should return view.dom if plugin is enabled', () => {
    const parent = document.createElement('div');
    parent.id = 'parant';
    const second = document.createElement('div');
    second.id = 'secondId';
    parent.appendChild(second);
    const third = document.createElement('div');
    third.id = 'thirdId';
    second.appendChild(third);
    const dom = document.createElement('div');
    dom.id = 'commentPlugin';
    third.appendChild(dom);

    const pluginContainer = document.createElement('div');
    pluginContainer.id = 'commentPlugin';
    dom.appendChild(pluginContainer);

    const mockView = {
      dom: dom,
      state: {
        doc: {
          attrs: {
            objectId: 'exampleObjectId',
          },
        },
      },
    } as unknown as EditorView;

    const result = plugin.perform(mockView);

    expect(result).toBe(true);
  });
});
