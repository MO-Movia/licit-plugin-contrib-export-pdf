export type StoredStyle = {
  name: string;
  level: number | string;
}

export type DocumentStyle = {
  description: string;
  docType?: string;
  isHidden: boolean;
  mode: number;
  otherStyleSelected: boolean;
  styleName: string;
  styles?: {
    align: string;
    boldNumbering: boolean;
    boldPartial: boolean;
    boldSentence: boolean;
    fontName: string;
    fontSize: string;
    isHidden: boolean;
    nextLineStyleName: boolean;
    styleLevel: string;
    toc: boolean;
  };
  toc: boolean;
}

export function getTableOfContentStyles(documentStyles: DocumentStyle[]): StoredStyle[] {
  return documentStyles
    .filter((style) => style?.styles?.toc === true)
    .map((style) => {
      return {
        name: style.styleName,
        level: style.styles.styleLevel
      };
    });
}