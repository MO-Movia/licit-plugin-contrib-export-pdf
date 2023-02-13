import {Schema} from 'prosemirror-model';
import {Plugin, PluginKey} from 'prosemirror-state';
import {
  makeKeyMapWithCommon,
  createKeyMapPlugin,
} from '@modusoperandi/licit-doc-attrs-step';

import {ExportPDFCommand} from './exportPdfCommand';
import {EditorView} from 'prosemirror-view';

export const KEY_EXPORT_PDF = makeKeyMapWithCommon(
  'exportPDF',
  'Mod-Alt' + '-p'
);
const EXPORT_PDF = new ExportPDFCommand();

export class ExportPDFPlugin extends Plugin {
  showButton: boolean = true;
  constructor(showButton: boolean) {
    super({
      key: new PluginKey('exportPDF'),
    });
    this.showButton = showButton;
  }

  // Plugin method that supplies plugin schema to editor
  getEffectiveSchema(schema: Schema): Schema {
    return schema;
  }

  initKeyCommands(): unknown {
    return createKeyMapPlugin(
      {
        [KEY_EXPORT_PDF.common]: EXPORT_PDF.execute,
      },
      'ExportPDFKeyMap'
    );
  }

  initButtonCommands(): unknown {
    return this.showButton
      ? {
          '[picture_as_pdf] Export to PDF': EXPORT_PDF,
        }
      : {};
  }

  // this helps to invoke even in readonly mode.
  perform(view: EditorView): void {
    EXPORT_PDF.execute(undefined, undefined, view);
  }
}
