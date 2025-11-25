import {ExportPDFCommand} from './exportPdfCommand';
import {EditorState} from 'prosemirror-state';
import {Transform} from 'prosemirror-transform';
import {EditorView} from 'prosemirror-view';
import {ExportPDF} from './exportPdf';

describe('Export PDF Command', () => {
  it('isEnabled returns true', () => {
    const exportPDFCommand = new ExportPDFCommand();
    const result = exportPDFCommand.isEnabled();
    expect(result).toBe(true);
  });

  it('executes exportPdf method with the correct argument and returns its result', () => {
    const exportPDFCommand = new ExportPDFCommand();
    const mockExportPDF = new ExportPDF();
    mockExportPDF.exportPdf = jest.fn().mockReturnValue(true);
    exportPDFCommand.exportPdf = mockExportPDF;
    const mockEditorState = {} as EditorState;
    const mockEditorView = {} as EditorView;
    const docJSON = {
      type: 'doc',
      attrs: {layout: null, padding: null, width: null},
      content: [
        {
          type: 'paragraph',
          attrs: {
            align: null,
            color: null,
            id: null,
            indent: null,
            lineSpacing: null,
            paddingBottom: null,
            paddingTop: null,
          },
          content: [
            {
              type: 'text',
              marks: [{type: 'mark-font-type', attrs: {name: 'Arial Black'}}],
              text: 'First line Arial black',
            },
          ],
        },
        {
          type: 'ordered_list',
          attrs: {
            id: null,
            counterReset: null,
            indent: 0,
            following: null,
            listStyleType: null,
            name: null,
            start: 1,
          },
          content: [
            {
              type: 'list_item',
              attrs: {align: null},
              content: [
                {
                  type: 'paragraph',
                  attrs: {
                    align: null,
                    color: null,
                    id: null,
                    indent: null,
                    lineSpacing: null,
                    paddingBottom: null,
                    paddingTop: null,
                  },
                  content: [{type: 'text', text: 'List 1'}],
                },
              ],
            },
          ],
        },
        {
          type: 'ordered_list',
          attrs: {
            id: null,
            counterReset: null,
            indent: 1,
            following: null,
            listStyleType: null,
            name: null,
            start: 1,
          },
          content: [
            {
              type: 'list_item',
              attrs: {align: null},
              content: [
                {
                  type: 'paragraph',
                  attrs: {
                    align: null,
                    color: null,
                    id: null,
                    indent: null,
                    lineSpacing: null,
                    paddingBottom: null,
                    paddingTop: null,
                  },
                  content: [{type: 'text', text: 'Child'}],
                },
              ],
            },
          ],
        },
        {
          type: 'ordered_list',
          attrs: {
            id: null,
            counterReset: 'none',
            indent: 0,
            following: null,
            listStyleType: null,
            name: null,
            start: 1,
          },
          content: [
            {
              type: 'list_item',
              attrs: {align: null},
              content: [
                {
                  type: 'paragraph',
                  attrs: {
                    align: null,
                    color: null,
                    id: null,
                    indent: null,
                    lineSpacing: null,
                    paddingBottom: null,
                    paddingTop: null,
                  },
                  content: [{type: 'text', text: 'List 2'}],
                },
              ],
            },
          ],
        },
        {
          type: 'paragraph',
          attrs: {
            align: 'center',
            color: null,
            id: null,
            indent: null,
            lineSpacing: null,
            paddingBottom: null,
            paddingTop: null,
          },
          content: [{type: 'text', text: 'Align'}],
        },
        {
          type: 'paragraph',
          attrs: {
            align: null,
            color: null,
            id: null,
            indent: null,
            lineSpacing: null,
            paddingBottom: null,
            paddingTop: null,
          },
          content: [
            {
              type: 'text',
              marks: [{type: 'mark-text-color', attrs: {color: '#f20d96'}}],
              text: 'Font',
            },
            {type: 'text', text: ' '},
            {
              type: 'text',
              marks: [
                {
                  type: 'mark-text-highlight',
                  attrs: {highlightColor: '#e5e5e5'},
                },
              ],
              text: 'Color ',
            },
            {type: 'text', marks: [{type: 'strong'}], text: 'align '},
            {
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'http://www.google.com',
                    rel: 'noopener noreferrer nofollow',
                    target: 'blank',
                    title: null,
                  },
                },
                {type: 'em'},
              ],
              text: 'Link to google',
            },
            {type: 'text', marks: [{type: 'em'}], text: ' '},
            {type: 'text', marks: [{type: 'underline'}], text: 'underline '},
            {
              type: 'text',
              marks: [
                {type: 'em'},
                {type: 'strong'},
                {type: 'mark-text-color', attrs: {color: '#e5e5e5'}},
                {
                  type: 'mark-text-highlight',
                  attrs: {highlightColor: '#979797'},
                },
                {type: 'underline'},
              ],
              text: 'combined',
            },
          ],
        },
        {
          type: 'heading',
          attrs: {
            align: null,
            color: null,
            id: null,
            indent: null,
            lineSpacing: null,
            paddingBottom: null,
            paddingTop: null,
            level: 1,
          },
          content: [{type: 'text', text: 'Header 1'}],
        },
        {
          type: 'paragraph',
          attrs: {
            align: null,
            color: null,
            id: null,
            indent: null,
            lineSpacing: null,
            paddingBottom: null,
            paddingTop: null,
          },
        },
        {
          type: 'table',
          attrs: {marginLeft: null},
          content: [
            {
              type: 'table_row',
              content: [
                {
                  type: 'table_cell',
                  attrs: {
                    colspan: 1,
                    rowspan: 1,
                    colwidth: null,
                    borderColor: null,
                    background: null,
                  },
                  content: [
                    {
                      type: 'paragraph',
                      attrs: {
                        align: null,
                        color: null,
                        id: null,
                        indent: null,
                        lineSpacing: null,
                        paddingBottom: null,
                        paddingTop: null,
                      },
                      content: [
                        {
                          type: 'text',
                          marks: [{type: 'strong'}],
                          text: 'Cell 1',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'table_cell',
                  attrs: {
                    colspan: 1,
                    rowspan: 1,
                    colwidth: null,
                    borderColor: null,
                    background: null,
                  },
                  content: [
                    {
                      type: 'paragraph',
                      attrs: {
                        align: null,
                        color: null,
                        id: null,
                        indent: null,
                        lineSpacing: null,
                        paddingBottom: null,
                        paddingTop: null,
                      },
                      content: [{type: 'text', text: 'Cell 2'}],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'paragraph',
          attrs: {
            align: null,
            color: null,
            id: null,
            indent: null,
            lineSpacing: null,
            paddingBottom: null,
            paddingTop: null,
          },
        },
        {
          type: 'paragraph',
          attrs: {
            align: null,
            color: null,
            id: null,
            indent: null,
            lineSpacing: null,
            paddingBottom: null,
            paddingTop: null,
          },
          content: [
            {type: 'text', text: 'Subscript '},
            {type: 'text', marks: [{type: 'super'}], text: '2 '},
          ],
        },
      ],
    };
    const result = exportPDFCommand.execute(
      mockEditorState,
      () => {
        return null;
      },
      mockEditorView,
      docJSON
    );
    expect(mockExportPDF.exportPdf).toHaveBeenCalledWith(mockEditorView, null);
    expect(result).toBe(true);
  });

  it('should wait for input', async () => {
    const command = new ExportPDFCommand();
    expect(
      await command.waitForUserInput(null as unknown as EditorState)
    ).toBeUndefined();
  });

  it('should not render label', () => {
    const command = new ExportPDFCommand();
    expect(command.renderLabel()).toBeNull();
  });

  it('should cancel', () => {
    const command = new ExportPDFCommand();
    expect(command.cancel()).toBeNull();
  });

  it('should be active', () => {
    const command = new ExportPDFCommand();
    expect(command.isActive()).toBeTruthy();
  });

  it('should not executeWithUserInput', () => {
    const command = new ExportPDFCommand();
    expect(
      command.executeWithUserInput(null as unknown as EditorState)
    ).toBeFalsy();
  });

  it('should execute custom', () => {
    const command = new ExportPDFCommand();
    expect(
      command.executeCustom(
        null as unknown as EditorState,
        null as unknown as Transform
      )
    ).toBeNull();
  });
  it('should handle execute', () => {
    const command = new ExportPDFCommand();
    expect(
      command.execute(
        {} as unknown as EditorState,
        () => {},
        {} as unknown as EditorView,
        {}
      )
    ).toBeFalsy();
    expect(
      command.execute(
        {} as unknown as EditorState,
        () => {},
        {} as unknown as EditorView,
        {}
      )
    ).toBeFalsy();
  });
});
