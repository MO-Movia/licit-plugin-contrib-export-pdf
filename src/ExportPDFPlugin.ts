import { Schema } from 'prosemirror-model';
import { Plugin, PluginKey } from 'prosemirror-state';
import { makeKeyMapWithCommon, createKeyMapPlugin } from '@modusoperandi/licit-doc-attrs-step';

import { ExportPDFCommand } from './exportPdfCommand';
import { EditorView } from 'prosemirror-view';

export const KEY_EXPORT_PDF = makeKeyMapWithCommon(
  'exportPDF',
  'Mod-Alt' + '-p'
);

export class ExportPDFPlugin extends Plugin {
  private EXPORT_PDF: ExportPDFCommand;

  constructor() {
    super({
      key: new PluginKey('exportPDF'),
    });

    this.EXPORT_PDF = new ExportPDFCommand();
  }

  // Plugin method that supplies plugin schema to editor
  public getEffectiveSchema(schema: Schema): Schema {
    return schema;
  }

  public initKeyCommands(): unknown {
    return createKeyMapPlugin(
      {
        [KEY_EXPORT_PDF.common]: this.EXPORT_PDF.execute,
      },
      'ExportPDFKeyMap'
    );
  }

  public initButtonCommands(): unknown {
    return {
      '[picture_as_pdf] Export to PDF': this.EXPORT_PDF,
    };
  }

  /**
   * @deprecated Use ExportPDFPlugin.export(view) instead.
   */

  // this helps to invoke even in readonly mode.
  public perform(view: EditorView): boolean {
    return ExportPDFPlugin.export(view, this.EXPORT_PDF);
  }

  public static export(view: EditorView, exportdf: ExportPDFCommand): boolean {
    return exportdf.execute(undefined, undefined, view);
  }
}
