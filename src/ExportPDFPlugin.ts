import {Schema} from 'prosemirror-model';
import {Plugin, PluginKey} from 'prosemirror-state';
import {
  makeKeyMapWithCommon,
  createKeyMapPlugin,
} from '@modusoperandi/licit-doc-attrs-step';

import {ExportPDFCommand} from './exportPdfCommand';
import {EditorView} from 'prosemirror-view';
import {DarkThemeIcon, LightThemeIcon} from './images';

export const KEY_EXPORT_PDF = makeKeyMapWithCommon(
  'exportPDF',
  'Mod-Alt' + '-p'
);
const EXPORT_PDF = new ExportPDFCommand();

export class ExportPDFPlugin extends Plugin {
  showButton = true;
  constructor(showButton: boolean) {
    super({
      key: new PluginKey('exportPDF'),
    });
    this.showButton = showButton;
  }

  // Plugin method that supplies plugin schema to editor
  public getEffectiveSchema(schema: Schema): Schema {
    return schema;
  }

  public initKeyCommands(): unknown {
    return createKeyMapPlugin(
      {
        [KEY_EXPORT_PDF.common]: EXPORT_PDF.execute,
      },
      'ExportPDFKeyMap'
    );
  }

  initButtonCommands(theme: string): unknown {
    if (this.showButton) {
      let image = null;
      if ('light' == theme) {
        image = LightThemeIcon;
      } else {
        image = DarkThemeIcon;
      }

      return {
        [`[${image}] Export to PDF`]: EXPORT_PDF,
      };
    } else {
      return {};
    }
  }
  /**
   * @deprecated Use ExportPDFPlugin.export(view) instead.
   */

  // this helps to invoke even in readonly mode.
  public perform(view: EditorView): boolean {
    return ExportPDFPlugin.export(view, null);
  }

  public static export(view: EditorView, doc: unknown): boolean {
    return EXPORT_PDF.execute(undefined, undefined, view, doc);
  }
}
