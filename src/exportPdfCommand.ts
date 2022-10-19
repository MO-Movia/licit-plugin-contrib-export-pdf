import { EditorState } from 'prosemirror-state';
import { Transform } from 'prosemirror-transform';
import { EditorView } from 'prosemirror-view';
import { UICommand } from '@modusoperandi/licit-doc-attrs-step';
import { ExportPDF } from './exportPdf';

export class ExportPDFCommand extends UICommand {
    exportPdf: ExportPDF;

    constructor() {
        super();
        this.exportPdf = new ExportPDF();
    }

    isEnabled = (): boolean => {
        return true;
    };

    execute = (
        _state: EditorState,
        _dispatch: (tr: Transform) => void,
        view: EditorView
    ): void => {
        this.exportPdf.exportPdf(view);
    };

}