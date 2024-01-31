import {EditorState} from 'prosemirror-state';
import {Transform} from 'prosemirror-transform';
import {EditorView} from 'prosemirror-view';
import {UICommand} from '@modusoperandi/licit-doc-attrs-step';
import {ExportPDF} from './exportPdf';
import React from 'react';

export class ExportPDFCommand extends UICommand {
  exportPdf: ExportPDF;

  constructor() {
    super();
    this.exportPdf = new ExportPDF();
  }

  isEnabled = (): boolean => {
    return true;
  };

  waitForUserInput = (
    _state: EditorState,
    _dispatch?: (tr: Transform) => void,
    _view?: EditorView,
    _event?: React.SyntheticEvent
  ): Promise<undefined> => {
    return Promise.resolve(undefined);
  };

  executeWithUserInput = (
    _state: EditorState,
    _dispatch?: (tr: Transform) => void,
    _view?: EditorView,
    _inputs?: string
  ): boolean => {
    return false;
  };

  cancel(): void {
    return null;
  }

  execute = (
    _state: EditorState,
    _dispatch: (tr: Transform) => void,
    view: EditorView
  ): boolean => {
    return this.exportPdf.exportPdf(view);
  };

  renderLabel() {
    return null;
  }
  isActive(): boolean {
    return true;
  }
  executeCustom(_state: EditorState, tr: Transform): Transform {
    return tr;
  }
}
