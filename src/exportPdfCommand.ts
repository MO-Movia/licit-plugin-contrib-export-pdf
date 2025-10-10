import { EditorState } from 'prosemirror-state';
import { Transform } from 'prosemirror-transform';
import { EditorView } from 'prosemirror-view';
import { UICommand } from '@modusoperandi/licit-doc-attrs-step';
import { ExportPDF } from './exportPdf';
import React from 'react';

export class ExportPDFCommand extends UICommand {

  private static isPreviewFormOpen = false;

  public exportPdf: ExportPDF;

  constructor() {
    super();
    this.exportPdf = new ExportPDF();
  }

  public isEnabled = (): boolean => {
    return true;
  };

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

  public cancel(): void {
    return null;
  }

  public execute = (
    _state: EditorState,
    _dispatch: (tr: Transform) => void,
    view: EditorView,
    doc: unknown
  ): boolean => {
    if (ExportPDFCommand.isPreviewFormOpen) {
      return false;
    }
    ExportPDFCommand.isPreviewFormOpen = true;
    return this.exportPdf.exportPdf(view, doc);
  };

  executeCustomStyleForTable(_state: EditorState, tr: Transform, _from: number, _to: number): Transform {
    return tr;
  }

  public renderLabel() {
    return null;
  }

  public isActive(): boolean {
    return true;
  }

  public executeCustom(_state: EditorState, tr: Transform): Transform {
    return tr;
  }

  public static closePreviewForm(): void {
    ExportPDFCommand.isPreviewFormOpen = false;
  }
}
