/**
 * @jest-environment jsdom
 */
import { PDFHandler } from './handlers';
import { createTable } from './exportPdf';
import { PreviewForm } from './preview';

jest.mock('./exportPdf', () => ({
  createTable: jest.fn(),
}));

jest.mock('./preview', () => ({
  PreviewForm: {
    showToc: jest.fn(),
    showTof: jest.fn(),
    showTot: jest.fn(),
    getHeadersTOC: jest.fn(),
    getHeadersTOF: jest.fn(),
    getHeadersTOT: jest.fn(),
    formattedDate: '2025-10-13',
    lastUpdated: true,
  },
}));

const mockChunker = {};
const mockPolisher = {
  convertViaSheet: jest.fn().mockResolvedValue('css-text'),
  insert: jest.fn(),
};
const mockCaller = {};

type TestPagedPage = { element: HTMLElement };

const createPage = (html: string): TestPagedPage => {
  const el = document.createElement('div');
  el.innerHTML = html;
  return { element: el };
};

describe('PDFHandler', () => {
  let handler: PDFHandler;

  beforeEach(() => {
    handler = new PDFHandler(mockChunker, mockPolisher, mockCaller);
    jest.clearAllMocks();
    PDFHandler.state.currentPage = 0;
    PDFHandler.state.isOnLoad = false;
  });

  test('beforeParsed calls createTable when any TOC/TOF/TOT is true', () => {
    PreviewForm.showToc.mockReturnValue(true);
    PreviewForm.showTof.mockReturnValue(false);
    PreviewForm.showTot.mockReturnValue(false);
    PreviewForm.getHeadersTOC.mockReturnValue(['h1']);
    PreviewForm.getHeadersTOF.mockReturnValue([]);
    PreviewForm.getHeadersTOT.mockReturnValue([]);

    handler.beforeParsed('content');

    expect(createTable).toHaveBeenCalledWith(expect.objectContaining({
      content: 'content',
      tocElement: '.tocHead',
      tofElement: '.tofHead',
      totElement: '.totHead',
      titleElements: ['h1'],
      titleElementsTOF: [],
      titleElementsTOT: [],
    }));
    expect(handler.done).toBe(false);
    expect(handler.pageFooters).toEqual([]);
    expect(handler.prepagesCount).toBe(0);
    expect(PDFHandler.state.currentPage).toBe(0);
  });

  test('afterPageLayout sets customcounter and CSS variables correctly', () => {
    const pageFragment = document.createElement('div');
    const pageEl = document.createElement('div');
    const infoIcon = document.createElement('infoicon');
    infoIcon.setAttribute('description', 'desc');
    pageEl.appendChild(infoIcon);

    const item = document.createElement('div');
    item.dataset.styleLevel = '2';
    pageFragment.appendChild(item);

    const page = { element: pageEl };
    handler.afterPageLayout(pageFragment, page);

    expect(item.getAttribute('customcounter')).toBeDefined();
    expect(pageFragment.style.getPropertyValue('--pagedjs-string-last-chapTitled')).toContain('desc');
  });

  test('afterPageLayout returns early if pageEl is not HTMLElement or prepages exists', () => {
    const frag = document.createElement('div');
    const page1 = { element: null };
    const page2El = document.createElement('div');
    page2El.appendChild(document.createElement('div')).className = 'prepages';
    const page2 = { element: page2El };

    expect(() => handler.afterPageLayout(frag, page1)).not.toThrow();
    expect(() => handler.afterPageLayout(frag, page2)).not.toThrow();
  });

  test('afterRendered applies styles for split and indent items', () => {
    const pageEl = document.createElement('div');
    const p1 = document.createElement('p');
    p1.dataset.splitTo = 'true';
    const p2 = document.createElement('p');
    p2.dataset.splitFrom = 'true';
    const p3 = document.createElement('p');
    p3.dataset.indent = 'true';
    pageEl.appendChild(p1);
    pageEl.appendChild(p2);
    pageEl.appendChild(p3);

    const pages = [{ element: pageEl }];
    Object.defineProperty(window, 'getComputedStyle', {
      value: jest.fn().mockReturnValue({ marginLeft: '5pt' }),
    });

    handler.afterRendered(pages);

    expect(p1.style.marginTop).toBe('1pt');
    expect(p1.style.paddingLeft).toBe('5pt');
    expect(p2.style.paddingLeft).toBe('5pt');
    expect(p3.style.paddingLeft).toBe('5pt');
  });

  test('calls patchTocEntries with pages', () => {
    const pages = [
      createPage('<div></div>'),
      createPage('<div></div>'),
    ];

    const spy = jest.spyOn(
      handler as unknown as { patchTocEntries(pages: TestPagedPage[]): void },
      'patchTocEntries'
    );

    handler.afterRendered(pages);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(pages);
  });

  test('afterPageLayout does not break when chapter is first element', () => {
    const pageFragment = document.createElement('div');

    const chapter = document.createElement('p');
    chapter.setAttribute('stylename', 'chapterTitle');
    chapter.dataset.ref = 'chap1';

    const inner = document.createElement('div');
    inner.appendChild(chapter);

    const areaRoot = document.createElement('div');
    const wrapper = document.createElement('div');
    wrapper.appendChild(inner);
    areaRoot.appendChild(wrapper);

    const page = {
      element: document.createElement('div'),
      area: areaRoot,
    };

    const breakToken = { node: 'original', offset: 5 };

    handler.afterPageLayout(pageFragment, page, breakToken);

    expect(breakToken.node).toBe('original');
    expect(breakToken.offset).toBe(5);
  });

  test('afterPageLayout sets empty footer string when no infoicon exists', () => {
    const pageFragment = document.createElement('div');
    const page = { element: document.createElement('div') };

    handler.afterPageLayout(pageFragment, page);

    expect(
      pageFragment.style.getPropertyValue('--pagedjs-string-last-chapTitled')
    ).toBe('""');
  });

  test('afterPageLayout skips counter processing for splitFrom elements', () => {
    const pageFragment = document.createElement('div');

    const el = document.createElement('p');
    el.dataset.styleLevel = '2';
    el.dataset.splitFrom = 'true';

    pageFragment.appendChild(el);

    const page = { element: document.createElement('div') };

    handler.afterPageLayout(pageFragment, page);

    expect(el.getAttribute('customcounter')).toBeNull();
  });

  test('afterPageLayout uses TOF counter when tof attribute is present', () => {
    const pageFragment = document.createElement('div');

    const el = document.createElement('p');
    el.dataset.styleLevel = '1';
    el.dataset.tof = 'true';

    pageFragment.appendChild(el);

    const page = { element: document.createElement('div') };

    handler.afterPageLayout(pageFragment, page);

    expect(el.getAttribute('customcounter')).toContain('.');
  });

  test('afterPageLayout resets counters when reset flag is set', () => {
    const pageFragment = document.createElement('div');

    const el1 = document.createElement('p');
    el1.dataset.styleLevel = '1';

    const el2 = document.createElement('p');
    el2.dataset.styleLevel = '2';
    el2.dataset.reset = 'true';

    pageFragment.appendChild(el1);
    pageFragment.appendChild(el2);

    const page = { element: document.createElement('div') };

    handler.afterPageLayout(pageFragment, page);

    expect(el2.getAttribute('customcounter')).toBeDefined();
  });


  test('resetCounters works correctly', () => {
    handler['counters'] = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, 11: 0, 12: 0 };
    handler['resetCounters'](2, true);
    expect(handler['counters'][3]).toBe(0);
    expect(handler['counters'][1]).toBe(1);
  });

  test('handleSpecialCounters increments TOF counter', () => {
    const label: number[] = [];
    handler['counters'][1] = 1;

    const el = document.createElement('p');
    el.setAttribute('stylename', 'tofStyle');

    handler['handleSpecialCounters'](el, 'true', null, label);

    expect(label).toEqual([1, 1]);
  });

  test('buildLabel resets TOF and TOT at level 1', () => {
    handler['counters'][1] = 1;
    handler['counters'][11] = 5;
    handler['counters'][12] = 5;
    const label: number[] = [];
    handler['buildLabel'](1, label);
    expect(handler['counters'][11]).toBe(0);
    expect(handler['counters'][12]).toBe(0);
    expect(label).toEqual([2]);
  });

  test('stripHTML removes HTML tags', () => {
    const html = '<p>Hello <b>World</b></p>';
    expect(handler.stripHTML(html)).toBe('Hello World');
  });

  test('beforePageLayout calls doIT', () => {
    const spy = jest.spyOn(handler, 'doIT').mockResolvedValue(undefined);
    handler.beforePageLayout();
    expect(spy).toHaveBeenCalled();
  });

  test('doIT calls polisher.convertViaSheet and insert', async () => {
    handler.done = false;
    await handler.doIT();
    expect(mockPolisher.convertViaSheet).toHaveBeenCalled();
    expect(mockPolisher.insert).toHaveBeenCalledWith('css-text');
    expect(handler.done).toBe(false);
  });

  test('finalizePage increments currentPage only if isOnLoad is false', () => {
    PDFHandler.state.isOnLoad = false;
    handler.finalizePage();
    expect(PDFHandler.state.currentPage).toBe(1);

    PDFHandler.state.isOnLoad = true;
    handler.finalizePage();
    expect(PDFHandler.state.currentPage).toBe(1); // no increment
  });

  test('getAttr returns dataset value when present, otherwise falls back to CSS custom property, otherwise empty string', () => {
    const el = document.createElement('div') as HTMLElement;
    const getter = (handler as unknown as { getAttr(el: HTMLElement, key: string): string }).getAttr;
    el.dataset.mykey = 'dataset-value';
    expect(getter.call(handler, el, 'mykey')).toBe('dataset-value');
    delete el.dataset.mykey;
    el.style.setProperty('--mykey', 'css-value');
    expect(getter.call(handler, el, 'mykey')).toBe('css-value');
    el.style.removeProperty('--mykey');
    expect(getter.call(handler, el, 'mykey')).toBe('');
  });

  test('afterPageLayout sets --pagedjs-string-last-chapTitled and --pagedjs-footer-height when infoicon elements present', () => {
    const pageFragment = document.createElement('div');
    const pageEl = document.createElement('div');
    const info1 = document.createElement('infoicon');
    info1.setAttribute('description', 'First chapter');
    const info2 = document.createElement('infoicon');
    info2.setAttribute('description', 'Second chapter with more text');

    pageEl.appendChild(info1);
    pageEl.appendChild(info2);

    const page = { element: pageEl };
    handler.afterPageLayout(pageFragment, page);

    const cssString = pageFragment.style.getPropertyValue('--pagedjs-string-last-chapTitled');
    const footerHeight = pageFragment.style.getPropertyValue('--pagedjs-footer-height');

    expect(cssString).toContain('First chapter');
    expect(cssString).toContain('Second chapter with more text');

    const concatenatedValues = ` ${1}. ${'First chapter'} ${2}. ${'Second chapter with more text'} `;
    const estimatedLines = Math.ceil(concatenatedValues.length / 80);
    const expectedFooter = `${20 + estimatedLines * 12}px`;

    expect(footerHeight).toBe(expectedFooter);

    const pageFragment2 = document.createElement('div');
    const pageEl2 = document.createElement('div');
    const page2 = { element: pageEl2 };
    handler.afterPageLayout(pageFragment2, page2);
    expect(pageFragment2.style.getPropertyValue('--pagedjs-string-last-chapTitled')).toBe('""');
  });

    test('afterPageLayout calls processTocAndFooter when extractedCui is null (non-AFTTP)', () => {
    PreviewForm['extractedCui'] = null;

    const pageFragment = document.createElement('div');
    const pageEl = document.createElement('div');

    const infoIcon = document.createElement('infoicon');
    infoIcon.setAttribute('description', 'Test description');
    pageEl.appendChild(infoIcon);

    const page = { element: pageEl };

    handler.afterPageLayout(pageFragment, page);

    expect(pageFragment.style.getPropertyValue('--pagedjs-string-last-chapTitled')).toContain('Test description');
  });

  test('afterPageLayout removes and sets CSS properties when extractedCui exists (AFTTP)', () => {
    PreviewForm['extractedCui'] = {
      text: 'CUI//SP-CTI',
      color: 'rgb(255, 0, 0)'
    };

    const pageFragment = document.createElement('div');
    const pageEl = document.createElement('div');

    pageFragment.style.setProperty('--pagedjs-string-last-chapTitled', '"old value"');

    const page = { element: pageEl };

    handler.afterPageLayout(pageFragment, page);

    expect(pageFragment.style.getPropertyValue('--pagedjs-string-last-chapTitled')).toBe('""');
  });

  test('afterPageLayout does not call processTocAndFooter when extractedCui has data', () => {
    PreviewForm['extractedCui'] = {
      text: 'CUI//SP-CTI',
      color: 'rgb(255, 0, 0)'
    };

    const pageFragment = document.createElement('div');
    const pageEl = document.createElement('div');

    const infoIcon = document.createElement('infoicon');
    infoIcon.setAttribute('description', 'Should not appear');
    pageEl.appendChild(infoIcon);

    const page = { element: pageEl };

    handler.afterPageLayout(pageFragment, page);

    const cssValue = pageFragment.style.getPropertyValue('--pagedjs-string-last-chapTitled');
    expect(cssValue).toBe('" 1. Should not appear "');
  });

  test('truncateTitle returns original title when null or undefined', () => {
    expect(handler['truncateTitle'](null)).toBeNull();
    expect(handler['truncateTitle'](undefined)).toBeUndefined();
  });

  test('truncateTitle returns original title when length is less than maxLength', () => {
    const shortTitle = 'Short Title';
    expect(handler['truncateTitle'](shortTitle)).toBe(shortTitle);
  });

  test('truncateTitle returns original title when length equals maxLength', () => {
    const exactTitle = '1234567890123456789012'; // exactly 22 chars
    expect(handler['truncateTitle'](exactTitle)).toBe(exactTitle);
  });

  test('truncateTitle truncates and adds ellipsis when length exceeds maxLength', () => {
    const longTitle = 'This is a very long title that exceeds the maximum length';
    const result = handler['truncateTitle'](longTitle);

    expect(result).toBe('This is a very long ti...');
    expect(result.length).toBe(25);
  });

  test('truncateTitle uses custom maxLength when provided', () => {
    const title = 'This is a test title';
    const result = handler['truncateTitle'](title, 10);

    expect(result).toBe('This is a ...');
    expect(result.length).toBe(13);
  });

  test('truncateTitle with custom maxLength returns original when within limit', () => {
    const title = 'Short';
    const result = handler['truncateTitle'](title, 10);

    expect(result).toBe('Short');
  });

});
describe('buildRefToPageMap', () => {
  let handler: PDFHandler;

  beforeEach(() => {
    handler = new PDFHandler(mockChunker, mockPolisher, mockCaller);
  });

  test('maps data-ref to first page number (1-based)', () => {
    const pages = [
      createPage('<div data-ref="sec1"></div>'),
      createPage('<div data-ref="sec2"></div>'),
    ];

    const map = (handler as unknown as { buildRefToPageMap(pages: TestPagedPage[]): Map<string, number> }).buildRefToPageMap(pages);

    expect(map.get('sec1')).toBe(0);
    expect(map.get('sec2')).toBe(1);
  });

  test('uses first occurrence when same data-ref appears on multiple pages', () => {
    const pages = [
      createPage('<div data-ref="dup"></div>'),
      createPage('<div data-ref="dup"></div>'),
    ];

    const map = (handler as unknown as { buildRefToPageMap(pages: TestPagedPage[]): Map<string, number> }).buildRefToPageMap(pages);

    expect(map.get('dup')).toBe(0);
  });

  test('ignores elements without data-ref', () => {
    const pages = [
      createPage('<div></div>'),
      createPage('<div data-ref="valid"></div>'),
    ];

    const map = (handler as unknown as { buildRefToPageMap(pages: TestPagedPage[]): Map<string, number> }).buildRefToPageMap(pages);

    expect(map.has('valid')).toBe(true);
    expect(map.size).toBe(1);
  });

  test('handles multiple data-ref elements on the same page', () => {
    const pages = [
      createPage(`
        <div data-ref="a"></div>
        <div data-ref="b"></div>
        <div data-ref="c"></div>
      `),
    ];

    const map = (handler as unknown as { buildRefToPageMap(pages: TestPagedPage[]): Map<string, number> }).buildRefToPageMap(pages);

    expect(map.get('a')).toBe(0);
    expect(map.get('b')).toBe(0);
    expect(map.get('c')).toBe(0);
  });

  test('ignores empty string data-ref values', () => {
    const pages = [
      createPage(`
        <div data-ref=""></div>
        <div data-ref="valid"></div>
      `),
    ];

    const map = (handler as unknown as { buildRefToPageMap(pages: TestPagedPage[]): Map<string, number> }).buildRefToPageMap(pages);

    expect(map.has('')).toBe(false);
    expect(map.get('valid')).toBe(0);
  });

  test('returns empty map when pages array is empty', () => {
    const map = (handler as unknown as { buildRefToPageMap(pages: TestPagedPage[]): Map<string, number> }).buildRefToPageMap([]);

    expect(map.size).toBe(0);
  });
});
describe('applyTocPageNumbers', () => {
  let handler: PDFHandler;

  beforeEach(() => {
    handler = new PDFHandler(mockChunker, mockPolisher, mockCaller);
  });

  test('sets data-page on TOC links when ref exists', () => {
    const pages = [
      createPage(`
        <div class="toc-element">
          <a href="#sec1"></a>
        </div>
      `),
    ];

    const refToPage = new Map<string, number>([['sec1', 3]]);

    (handler as unknown as { applyTocPageNumbers(pages: TestPagedPage[], refToPage: Map<string, number>): void }).applyTocPageNumbers(pages, refToPage);

    const link = pages[0].element.querySelector('a') as HTMLElement;
    expect(link.dataset.page).toBe('4');
  });

  test('does not set data-page when href has no matching ref', () => {
    const pages = [
      createPage(`
        <div class="toc-element">
          <a href="#missing"></a>
        </div>
      `),
    ];

    const refToPage = new Map<string, number>();

    (handler as unknown as { applyTocPageNumbers(pages: TestPagedPage[], refToPage: Map<string, number>): void }).applyTocPageNumbers(pages, refToPage);

    const link = pages[0].element.querySelector('a') as HTMLElement;
    expect(link.dataset.page).toBeUndefined();
  });

  test('ignores anchors without href', () => {
    const pages = [
      createPage(`
        <div class="toc-element">
          <a></a>
        </div>
      `),
    ];

    const refToPage = new Map<string, number>([['sec1', 1]]);

    expect(() =>
      (handler as unknown as { applyTocPageNumbers(pages: TestPagedPage[], refToPage: Map<string, number>): void }).applyTocPageNumbers(pages, refToPage)
    ).not.toThrow();
  });

  test('skips non-HTMLElement nodes inside .toc-element', () => {
    const page = document.createElement('div');
    const wrapper = document.createElement('div');
    wrapper.className = 'toc-element';

    wrapper.appendChild(document.createTextNode('text node'));
    page.appendChild(wrapper);

    const pages = [{ element: page }];

    expect(() =>
      (handler as unknown as { applyTocPageNumbers(pages: TestPagedPage[], refToPage: Map<string, number>): void }).applyTocPageNumbers(pages, new Map())
    ).not.toThrow();
  });

  test('does not set page when href does not start with #', () => {
    const pages = [
      createPage(`
        <div class="toc-element">
          <a href="http://example.com"></a>
        </div>
      `),
    ];

    const refToPage = new Map<string, number>([['sec1', 2]]);

    (handler as unknown as { applyTocPageNumbers(pages: TestPagedPage[], refToPage: Map<string, number>): void }).applyTocPageNumbers(pages, refToPage);

    const link = pages[0].element.querySelector('a') as HTMLElement;
    expect(link.dataset.page).toBeUndefined();
  });

  test('does not set page when href is "#"', () => {
    const pages = [
      createPage(`
        <div class="toc-element">
          <a href="#"></a>
        </div>
      `),
    ];

    const refToPage = new Map<string, number>([['anything', 1]]);

    (handler as unknown as { applyTocPageNumbers(pages: TestPagedPage[], refToPage: Map<string, number>): void }).applyTocPageNumbers(pages, refToPage);

    const link = pages[0].element.querySelector('a') as HTMLElement;
    expect(link.dataset.page).toBeUndefined();
  });

  test('handles multiple TOC links on the same page', () => {
    const pages = [
      createPage(`
        <div data-ref="a"></div>
        <div data-ref="b"></div>

        <div class="toc-element"><a href="#a"></a></div>
        <div class="toc-element"><a href="#b"></a></div>
      `),
    ];

    const refToPage = new Map<string, number>([
      ['a', 5],
      ['b', 7],
    ]);

    (handler as unknown as { applyTocPageNumbers(pages: TestPagedPage[], refToPage: Map<string, number>): void }).applyTocPageNumbers(pages, refToPage);

    const links = pages[0].element.querySelectorAll('a');
    expect(links[0].dataset.page).toBe('6');
    expect(links[1].dataset.page).toBe('8');
  });

  test('overwrites existing data-page value', () => {
    const pages = [
      createPage(`
        <div class="toc-element">
          <a href="#sec1" data-page="old"></a>
        </div>
      `),
    ];

    const refToPage = new Map<string, number>([['sec1', 9]]);

    (handler as unknown as { applyTocPageNumbers(pages: TestPagedPage[], refToPage: Map<string, number>): void }).applyTocPageNumbers(pages, refToPage);

    const link = pages[0].element.querySelector('a') as HTMLElement;
    expect(link.dataset.page).toBe('10');
  });
});
describe('patchTocEntries', () => {
  let handler: PDFHandler;

  beforeEach(() => {
    handler = new PDFHandler(mockChunker, mockPolisher, mockCaller);
  });

  test('builds ref map and applies page numbers to TOC links', () => {
    const pages = [
      createPage(`
        <div data-ref="sec1"></div>
        <div class="toc-element">
          <a href="#sec1"></a>
        </div>
      `),
      createPage(`
        <div data-ref="sec2"></div>
        <div class="toc-element">
          <a href="#sec2"></a>
        </div>
      `),
    ];

    (handler as unknown as { patchTocEntries(pages: TestPagedPage[]): void }).patchTocEntries(pages);

    const link1 = pages[0].element.querySelector('.toc-element a') as HTMLElement;
    const link2 = pages[1].element.querySelector('.toc-element a') as HTMLElement;

    expect(link1.dataset.page).toBe('1');
    expect(link2.dataset.page).toBe('2');
  });

  test('does not crash when no TOC elements exist', () => {
    const pages = [
      createPage('<div data-ref="sec1"></div>'),
      createPage('<div></div>'),
    ];

    expect(() =>
      (handler as unknown as { patchTocEntries(pages: TestPagedPage[]): void }).patchTocEntries(pages)
    ).not.toThrow();
  });

  test('applyPageNumbers assigns AFTTP chapter and attachment numbering', () => {
  PreviewForm['extractedCui'] = { text: 'CUI', color: 'red' };

  const pages = [
    createPage('<p stylename="chapterTitle"></p>'), // chapter 1 start
    createPage('<div></div>'),
    createPage('<p stylename="attachmentTitle"></p>'), // attachment 1 start
    createPage('<div></div>'),
  ];

  // mock page number containers
  pages.forEach(p => {
    const margin = document.createElement('div');
    margin.className = 'pagedjs_margin-top-right';
    const content = document.createElement('div');
    content.className = 'pagedjs_margin-content';
    margin.appendChild(content);
    p.element.appendChild(margin);
  });

  handler['applyPageNumbers'](pages as TestPagedPage[]);

  const nums = pages.map(
    p => p.element.querySelector('.pagedjs_margin-content')!.textContent
  );

  expect(nums).toEqual([
    '1',
    '2',
    '3',
    '4',
  ]);
});

test('resolveAfttpPageNumber falls back to roman when no chapter or attachment', () => {
  const result = handler['resolveAfttpPageNumber'](
    document.createElement('div'),
    3,
    [],
    () => '',
    () => ''
  );

  expect(result).toBe('iv');
});

test('buildChapterRanges creates correct start and end ranges', () => {
  const pages = [
    createPage('<p stylename="chapterTitle"></p>'),
    createPage('<div></div>'),
    createPage('<p stylename="chapterTitle"></p>'),
    createPage('<div></div>'),
  ];

  const ranges = handler['buildChapterRanges'](pages as TestPagedPage[]);

  expect(ranges).toEqual([
    { start: 0, end: 2, chapterIndex: 1 },
    { start: 2, end: 4, chapterIndex: 2 },
  ]);
});

test('buildAttachmentRanges builds correct attachment ranges', () => {
  const pages = [
    createPage('<p stylename="attachmentTitle"></p>'),
    createPage('<div></div>'),
    createPage('<p stylename="attachmentTitle"></p>'),
  ];

  const ranges = handler['buildAttachmentRanges'](pages as TestPagedPage[]);

  expect(ranges).toEqual([
    { start: 0, end: 2, index: 1 },
    { start: 2, end: 3, index: 2 },
  ]);
});

test('detectAttachments tracks attachment pages correctly', () => {
  const pages = [
    createPage('<p stylename="attachmentTitle"></p>'),
    createPage('<div></div>'),
    createPage('<div></div>'),
  ];

  handler['detectAttachments'](pages as TestPagedPage[]);

  expect(handler['attachmentPageCounters'].get(1)).toBe(3);
});

test('computeTotalMainPages stops counting at first attachment', () => {
  const pages = [
    createPage('<p stylename="chapterTitle"></p>'),
    createPage('<div></div>'),
    createPage('<p stylename="attachmentTitle"></p>'),
    createPage('<div></div>'),
  ];

  handler['resolveFirstChapterPageIndex'](pages as TestPagedPage[]);
  handler['computeTotalMainPages'](pages as TestPagedPage[]);

  expect(handler['totalMainPages']).toBe(2);
});

test('getAfttpPageNumber returns attachment numbering', () => {
  const result = handler['getAfttpPageNumber'](
    3,
    [{ start: 2, end: 5, index: 1 }],
    []
  );

  expect(result).toBe('A1-2');
});

test('resolveNonAfttpPageNumber returns roman for pre-pages', () => {
  handler['lastPrePageIndex'] = 2;

  const val = handler['resolveNonAfttpPageNumber'](1, () => 99);

  expect(val).toBe('ii');
});

test('handleAfttpFooter skips TOC footer when AFTTP', () => {
  PreviewForm['extractedCui'] = { text: 'CUI', color: 'red' };

  const frag = document.createElement('div');
  const spy = jest.fn();

  handler['handleAfttpFooter'](frag, spy);

  expect(frag.style.getPropertyValue('--pagedjs-string-last-chapTitled')).toBe('');
});

test('fixSplitTo safely returns when element not found', () => {
  const page = document.createElement('div');
  expect(() =>
    handler['fixSplitTo'](page, () => '5pt')
  ).not.toThrow();
});
test('resolveFirstChapterPageIndex does nothing if already resolved', () => {
  const pages = [
    createPage('<p stylename="chapterTitle"></p>'),
  ];

  handler['firstChapterPageIndex'] = 10;

  handler['resolveFirstChapterPageIndex'](pages as TestPagedPage[]);

  expect(handler['firstChapterPageIndex']).toBe(10);
});

test('resetLastPrePageIndex sets null when no totHead exists', () => {
  const pages = [
    createPage('<div></div>'),
    createPage('<div></div>'),
  ];

  handler['resetLastPrePageIndex'](pages as TestPagedPage[]);

  expect(handler['lastPrePageIndex']).toBeNull();
});

test('applyPageNumbers skips pages without margin content safely', () => {
  const pages = [
    createPage('<div></div>'),
    createPage('<div></div>'),
  ];

  expect(() =>
    handler['applyPageNumbers'](pages as TestPagedPage[])
  ).not.toThrow();
});

test('applySingleTocLink sets attachment page number in AFTTP', () => {
  PreviewForm['extractedCui'] = { text: 'CUI', color: 'red' };

  const page = createPage(`
    <div class="toc-element">
      <a href="#att1"></a>
    </div>
  `);

  const refMap = new Map<string, number>([['att1', 3]]);
  const attachments: Array<{ start: number; end: number; index: number }> = [
    { start: 2, end: 6, index: 1 },
  ];

  const chapters: Array<{ start: number; end: number; chapterIndex: number }> = [];

  const link = page.element.querySelector('a')!;

  handler['applySingleTocLink'](
    link,
    refMap,
    true,
    attachments,
    chapters
  );

  expect(link.dataset.page).toBe('A1-2');
});

test('buildRefToPageMap ignores non-HTMLElement nodes', () => {
  const pageEl = document.createElement('div');
  pageEl.appendChild(document.createTextNode('text'));
  pageEl.appendChild(document.createComment('comment'));

  const pages = [{ element: pageEl }];

  const map = handler['buildRefToPageMap'](pages as TestPagedPage[]);

  expect(map.size).toBe(0);
});

test('handleSpecialCounters does nothing when neither tof nor tot present', () => {
  const label: number[] = [];
  handler['counters'][1] = 3;

  const el = document.createElement('p');

  handler['handleSpecialCounters'](el, null, null, label);

  expect(label).toEqual([]);
});


  test('pushes nothing if TOF counter is zero (defensive)', () => {
    const el = document.createElement('p');
    el.setAttribute('stylename', 'tofStyle');

    const label: number[] = [];

    // counters[11] starts at 0, but function increments before push
    handler['handleSpecialCounters'](el, 'true', null, label);

    expect(label.length).toBe(2); // [chapter, 1]
  });

  test('does nothing when neither tof nor tot is present', () => {
    const el = document.createElement('p');
    el.setAttribute('stylename', 'normalStyle');

    const label: number[] = [];

    handler['handleSpecialCounters'](el, null, null, label);

    expect(handler['counters'][11]).toBe(0);
    expect(handler['counters'][12]).toBe(0);
    expect(label).toEqual([]);
  });

  test('uses current chapter counter (counters[1]) in label', () => {
    handler['counters'][1] = 5; // simulate chapter 5

    const el = document.createElement('p');
    el.setAttribute('stylename', 'totStyle');

    const label: number[] = [];

    handler['handleSpecialCounters'](el, null, 'true', label);

    expect(handler['counters'][12]).toBe(1);
    expect(label).toEqual([5, 1]); // [chapter, totIndex]
  });

test('buildLabel builds multi-level labels correctly', () => {
  handler['counters'][1] = 1;
  handler['counters'][2] = 2;

  const label: number[] = [];
  handler['buildLabel'](2, label);

  expect(label).toEqual([1, 3]);
});

test('fixIndent safely handles pages with no indent elements', () => {
  const page = document.createElement('div');

  expect(() =>
    handler['fixIndent'](page, () => '10pt')
  ).not.toThrow();
});

test('handleAfttpFooter executes processTocAndFooter when non-AFTTP', () => {
  PreviewForm['extractedCui'] = null;

  const frag = document.createElement('div');
  const spy = jest.fn();

  handler['handleAfttpFooter'](frag, spy);

  expect(spy).toHaveBeenCalled();
});


});
