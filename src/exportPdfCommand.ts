import { EditorState } from 'prosemirror-state';
import { Transform } from 'prosemirror-transform';
import { EditorView } from 'prosemirror-view';
import { UICommand } from '@modusoperandi/licit-doc-attrs-step';
import { ExportPDF } from './exportPdf';
import React from 'react';

export class ExportPDFCommand extends UICommand {
  public exportPdf: ExportPDF;

  constructor() {
    super();
    this.exportPdf = new ExportPDF();
  }

  public isEnabled = (): boolean => {
    return true;
  };

  /* eslint-disable @typescript-eslint/no-unused-vars */
  public waitForUserInput = (
    _state: EditorState,
    _dispatch?: (tr: Transform) => void,
    _view?: EditorView,
    _event?: React.SyntheticEvent
  ): Promise<undefined> => {
    return Promise.resolve(undefined);
  };

  public executeWithUserInput = (
    _state: EditorState,
    _dispatch?: (tr: Transform) => void,
    _view?: EditorView,
    _inputs?: string
  ): boolean => {
    return false;
  };
  /* eslint-enable @typescript-eslint/no-unused-vars */

  public cancel(): void {
    return null;
  }

  public execute = (
    _state: EditorState,
    _dispatch: (tr: Transform) => void,
    view: EditorView
  ): boolean => {
    return this.exportPdf.exportPdf(view);
  };

  public renderLabel(): null {
    return null;
  }

  public isActive(): boolean {
    return true;
  }

  public executeCustom(_state: EditorState, tr: Transform): Transform {
    return tr;
  }
}
