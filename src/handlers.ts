import { Handler } from 'pagedjs';
import { createTable } from './exportPdf';
import { PreviewForm } from './preview';

interface PagedPage {
  element: HTMLElement;
}
export class PDFHandler extends Handler {
  // static field needs to be readonly for sonar
  private readonly processedChapterRefs = new Set<string>();
  private static lastMode: 'afttp' | 'non-afttp' | null = null;
  public static readonly state = {
    currentPage: 0,
    isOnLoad: false,
  };

  public done = false;
  public countTOC = 0;
  public pageFooters: Array<HTMLElement> = [];
  public prepagesCount = 0;
  public caller;
  public chunker;
  private counters = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0, // this is for the tof
    12: 0// this is for the tot
  };

  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.caller = caller;
    this.chunker = chunker;
  }

  public beforeParsed(content): void {
    this.pageFooters = [];
    this.prepagesCount = 0;
    PDFHandler.state.currentPage = 0;
    this.done = false;
    document.documentElement.style.removeProperty(
    '--pagedjs-string-last-chapTitled'
  );

    if (PreviewForm.showToc() || PreviewForm.showTof() || PreviewForm.showTot()) {
      createTable({
        content: content,
        tocElement: '.tocHead',
        tofElement: '.tofHead',
        totElement: '.totHead',
        titleElements: PreviewForm.getHeadersTOC(),
        titleElementsTOF: PreviewForm.getHeadersTOF(),
        titleElementsTOT: PreviewForm.getHeadersTOT(),
      });
    }

  }

  public afterPageLayout(pageFragment, page, breakToken): void {
    const styles = [
      'chapterTitle',
      'attachmentTitle',
    ];
    const pageEl = page?.element instanceof HTMLElement ? page.element : null;
    if (!pageEl) return;
    // Page break handling for chapters/attachments
    const selector = styles.map(s => `[stylename="${s}"]`).join(', ');
    if (breakToken && page.area) {
      const chapterCandidates = Array.from(
        page.area.querySelectorAll(selector)
      ) as unknown as HTMLElement[];

      // First item on this page that we haven't already handled
      const chapterEl = chapterCandidates.find((el) => {
        const ref = el.dataset.ref;
        return !!ref && !this.processedChapterRefs.has(ref);
      });

      if (
        chapterEl?.dataset?.ref &&
        chapterEl !== page.area.firstElementChild.children[0].children[0]
      ) {
        const ref = chapterEl.dataset.ref;
        this.processedChapterRefs.add(ref); // mark as handled

        // Find same chapter node in original source DOM
        const chapterSource = this.chunker.source.querySelector(
          `[data-ref="${ref}"]`
        ) as HTMLElement | null;

        if (chapterSource) {
          // Tell Paged.js: next page starts AT this chapter node
          breakToken.node = chapterSource;
          breakToken.offset = 0;

          // Remove chapter and everything after it from current page fragment
          let cur: Element | null = chapterEl;
          while (cur) {
            const next = cur.nextElementSibling;
            cur.remove();
            cur = next;
          }
        }
      }
    }

    const processTocAndFooter = () => {
      const tocElements = page?.element?.querySelectorAll('infoicon');
      let concatenatedValues = '';

      if (tocElements) {
        for (const [, element] of tocElements.entries()) {
          this.prepagesCount++;
          const description = element.getAttribute('description') ?? '';
          const cleanedDescription = ` ${this.prepagesCount}. ${this.stripHTML(description)}`;
          concatenatedValues += cleanedDescription + ' ';
        }
      }

      if (tocElements?.length) {
        const estimatedLines = Math.ceil(concatenatedValues.length / 80);
        const footerHeight = 20 + estimatedLines * 12;

        pageFragment.style.setProperty('--pagedjs-string-last-chapTitled', `"${concatenatedValues}"`);
        pageFragment.style.setProperty('--pagedjs-footer-height', `${footerHeight}px`);
      } else {
        pageFragment.style.setProperty('--pagedjs-string-last-chapTitled', '""');
      }
    };

    const processSingleItem = (el: Element) => {
      if (!(el instanceof HTMLElement)) return;
      if (el.dataset.splitFrom) return;

      const level = Number.parseInt(el.dataset.styleLevel ?? '1', 10);
      const prefix = this.getAttr(el, 'prefix');
      const tof = this.getAttr(el, 'tof');
      const tot = this.getAttr(el, 'tot');

      const isReset =
        el.dataset.reset === 'true' ||
        (el instanceof HTMLElement && el.style.getPropertyValue('--reset-flag') === '1');

      const label: number[] = [];

      if (tof || tot) {
        this.handleSpecialCounters(tof, tot, label);
      } else {
        this.resetCounters(level, isReset);
        this.buildLabel(level, label);
      }

      const counterVal = (prefix ? prefix + ' ' : '') + label.join('.');
      el.setAttribute('customcounter', counterVal + '.');
    };

    const processCounters = () => {
      const items = pageFragment instanceof HTMLElement
        ? pageFragment.querySelectorAll('[data-style-level]')
        : [];

      if (!items) return;

      for (const [, el] of items.entries()) {
        processSingleItem(el);
      }
    };

    this.handleAfttpFooter(pageFragment as HTMLElement, processTocAndFooter);

    processCounters();
  }

  private handleAfttpFooter(
    pageFragment: HTMLElement,
    processTocAndFooter: () => void
  ): void {
    const markingData  = PreviewForm['pageBanner'];
    const hasBannerMarking  = !!markingData ;

    if (hasBannerMarking ) {
      pageFragment.style.removeProperty(
        '--pagedjs-string-last-chapTitled'
      );
      pageFragment.style.setProperty(
        '--pagedjs-string-last-chapTitled',
        '""'
      );
      return;
    }

    processTocAndFooter();
  }


  public afterRendered(pages) {
    this.patchTocEntries(pages);
    const getMarginLeft = (el) => globalThis.getComputedStyle(el).marginLeft || '0pt';

    for (const pageObj of pages) {
      const page = pageObj.element;

      const splitToItems = page.querySelectorAll('p[data-split-to]');
      if (splitToItems.length > 0) {
        const el = splitToItems[0];
        const mLeft = getMarginLeft(el);
        el.style.setProperty('margin-top', '1pt', 'important');
        el.style.setProperty('margin-left', '0pt', 'important');
        el.style.setProperty('padding-left', mLeft, 'important');
      }

      const splitFromItems = page.querySelectorAll('p[data-split-from]');
      if (splitFromItems.length > 0) {
        const el = splitFromItems[0];
        const mLeft = getMarginLeft(el);
        el.style.setProperty('margin-left', '0pt', 'important');
        el.style.setProperty('padding-left', mLeft, 'important');
      }

      const indentItems = page.querySelectorAll('p[data-indent]');
      for (const el of indentItems) {
        const mLeft = getMarginLeft(el);
        el.style.setProperty('margin-left', '0pt', 'important');
        el.style.setProperty('padding-left', mLeft, 'important');
      }
    }
  }


  private resetCounters(level: number, isReset: boolean): void {
    for (let i = level + 1; i <= 10; i++) this.counters[i] = 0;

    if (isReset) {
      for (let i = 1; i <= level; i++) {
        this.counters[i] = i === level ? 0 : 1;
      }
    }
  }

  private handleSpecialCounters(tof: string | null, tot: string | null, label: number[]): void {
    if (tof) {
      this.counters[11]++;
      if (this.counters[11]) label.push(this.counters[1], this.counters[11]);
    } else if (tot) {
      this.counters[12]++;
      if (this.counters[12]) label.push(this.counters[1], this.counters[12]);
    }
  }

  private buildLabel(level: number, label: number[]): void {
    if (level === 1 && this.counters[1] > 0) {
      this.counters[11] = 0;
      this.counters[12] = 0;
    }

    this.counters[level]++;
    for (let i = 1; i <= level; i++) {
      if (this.counters[i]) label.push(this.counters[i]);
    }
  }

  private getAttr(el: HTMLElement, key: string): string {
    return (
      el.dataset[key] ||
      el.style.getPropertyValue(`--${key}`)
    );
  }


  stripHTML(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  private patchTocEntries(pages: PagedPage[]): void {
    const refToPage = this.buildRefToPageMap(pages);
    this.applyTocPageNumbers(pages, refToPage);
  }

  private buildRefToPageMap(pages: PagedPage[]): Map<string, number> {
    const refToPage = new Map<string, number>();

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const pageEl = pages[pageIndex].element;

      const targets = pageEl.querySelectorAll<HTMLElement>('[data-ref]');
      for (const el of targets) {
        const ref = el.dataset.ref;
        if (ref && !refToPage.has(ref)) {
          refToPage.set(ref, pageIndex + 1); // pages are 1-based
        }
      }
    }

    return refToPage;
  }

  private applyTocPageNumbers(
    pages: PagedPage[],
    refToPage: Map<string, number>
  ): void {
    for (const pageObj of pages) {
      const pageEl = pageObj.element;

      const tocLinks = pageEl.querySelectorAll('.toc-element a');

      for (const link of tocLinks) {
        if (!(link instanceof HTMLElement)) continue;

        const id = link.getAttribute('href')?.slice(1);
        const pageNum = id ? refToPage.get(id) : undefined;

        if (pageNum !== undefined) {
          link.dataset.page = String(pageNum);
        }
      }
    }
  }

    private truncateTitle(title: string, maxLength = 22): string {
    if (!title || title.length <= maxLength) {
      return title;
    }
    return title.slice(0, maxLength) + '...';
  }

  public beforePageLayout(): void {
    this.doIT();
  }

public async doIT(): Promise<void> {
  const markingData  = PreviewForm['pageBanner'];
  const hasBannerMarking  = !!markingData ;
  const rawTitle = PreviewForm['documentTitle'];
  const titleData = this.truncateTitle(rawTitle);

  let nonAfttpFooterColor = '';
  let opt = '';
  let opt2 = '';
  let pageOverride = '';
  let headerTitleContent = '';

  // 🔥 CLEAR ALL FOOTER-RELATED STYLES WHEN SWITCHING MODES
  document.documentElement.style.removeProperty('--pagedjs-string-last-chapTitled');
  document.documentElement.style.removeProperty('--pagedjs-footer-height');

  // Remove previously injected styles to avoid conflicts
const currentMode = markingData  ? 'afttp' : 'non-afttp';

if (PDFHandler.lastMode !== currentMode) {
  const existingStyles = document.querySelectorAll(
    'style[data-licit-pdf-handler]'
  );
  for (const style of existingStyles) {
    style.remove();
  }
  PDFHandler.lastMode = currentMode;
}

  if (!hasBannerMarking ) {
    pageOverride = `
      @page {
        margin-bottom: var(--pagedjs-footer-height, 40px);
        @bottom-center {
          content: var(--pagedjs-string-last-chapTitled);
        }
      }`;

    nonAfttpFooterColor = `
      .pagedjs_page 
      .pagedjs_margin-bottom-center > .pagedjs_margin-content::after {
        color: #2A6EBB;
      }
    `;
  }

  if (hasBannerMarking  && markingData ) {
      if (titleData) {
    headerTitleContent = `
      @top-left {
        content: "${titleData}";
        font-family: "Times New Roman", Times, serif;
        font-size: 12pt;
        text-align: left;
        color: #333333;
        padding-top: 60px;
      }
    `;
    }
    opt = `
      @top-center {
        content: "${markingData .text}";
        font-family: "Times New Roman", Times, serif;
        font-size: 14pt;
        text-align: center;
        color: ${markingData .color};
        padding-left: 0.9in;
      }

      @bottom-center {
        content: "${markingData .text}";
        font-family: "Times New Roman", Times, serif;
        font-size: 14pt;
        text-align: center;
        color: ${markingData .color};
        padding-top: 72px;
      }

      @bottom-left {
        content: "Page " counter(page) " of " counter(pages);
        color: #333333;
      }
    `;
    opt2 = `
    .ProseMirror infoicon {
      string-set: none !important;
    }
  `;
  } else {
    opt2 = `
      .ProseMirror infoicon {
        string-set: chapTitled content(text);
      }
    `;

    opt = `
      @bottom-center {
        content: string(chapTitled, last);
        text-align: right;
      }

      @bottom-left {
        content: "Page " counter(page) " of " counter(pages);
        color: #333333;
      }
    `;
  }

  let lastUpdatedStyle = '';
  if (PreviewForm['lastUpdated']) {
    lastUpdatedStyle = `@top-right {
      content: "${'Last Updated On: ' + PreviewForm['formattedDate']}";
      text-align: right;
      font-size: 11px;
      color: #333333;
      padding-top: 63px;
      font-style: italic;
    }`;
  }

  // Always regenerate styles to ensure correct mode
  const text = await this['polisher'].convertViaSheet(`@media print {@page {
${opt}
${lastUpdatedStyle}
${headerTitleContent}
}
${pageOverride}
${opt2}
${nonAfttpFooterColor}
/* set the style for the list numbering to none */
#list-toc-generated {
list-style: none;
}

.forcePageSpacer {
  break-after: page;
  page-break-after: always; 
  display: block;
  min-height: 1px;
}

#list-toc-generated .toc-element {
break-inside: avoid;
}

#list-toc-generated .toc-element a::after {
content: attr(data-page);
float: right;
}

#list-toc-generated .toc-element-level-1 {
margin-top: 25px;
font-weight: bold;
}

#list-toc-generated .toc-element-level-2 {
margin-left: 25px;
}

/* counters */

#list-toc-generated {
counter-reset: counterTocLevel1;
}

#list-toc-generated .toc-element-level-1 {
counter-increment: counterTocLevel1;
counter-reset: counterTocLevel2;
}

#list-toc-generated .toc-element-level-1::before {
content: counter(counterTocLevel1) ". ";
padding-right: 5px;
}

#list-toc-generated .toc-element-level-2 {
counter-increment: counterTocLevel2;
}

#list-toc-generated .toc-element-level-2::before {
content: counter(counterTocLevel1) ". " counter(counterTocLevel2) ". ";
padding-right: 5px;
}

/* hack for leaders */

#list-toc-generated {
overflow-x: hidden;
}

/* fake leading */
#list-toc-generated .toc-element::after {
content: ".............................................."
".............................................."
".............................................." "........";
float: left;
width: 0;
padding-left: 5px;
letter-spacing: 2px;
color: #2A6EBB;
}

#list-tof-generated {
list-style: none;
}

#list-tof-generated .tof-element {
break-inside: avoid;
}

#list-tof-generated .tof-element a::after {
content: target-counter(attr(href), page);
float: right;
}

#list-tof-generated .tof-element-level-1 {
margin-top: 25px;
font-weight: bold;
}

#list-tof-generated .tof-element-level-2 {
margin-left: 25px;
}

/* counters */

#list-tof-generated {
counter-reset: counterTocLevel1;
}

.totHead{
  margin-bottom: 700px;
}

#list-tof-generated .tof-element-level-1 {
counter-increment: counterTocLevel1;
counter-reset: counterTocLevel2;
}

#list-tof-generated .tof-element-level-1::before {
content: counter(counterTocLevel1) ". ";
padding-right: 5px;
}

#list-tof-generated .tof-element-level-2 {
counter-increment: counterTocLevel2;
}

#list-tof-generated .tof-element-level-2::before {
content: counter(counterTocLevel1) ". " counter(counterTocLevel2) ". ";
padding-right: 5px;
}

/* hack for leaders */

#list-tof-generated {
overflow-x: hidden;
}

/* fake leading */
#list-tof-generated .tof-element::after {
content: ".............................................."
".............................................."
".............................................." "........";
float: left;
width: 0;
padding-left: 5px;
letter-spacing: 2px;
color: #2A6EBB;
}

#list-tot-generated {
list-style: none;
}

#list-tot-generated .tot-element {
break-inside: avoid;
}

#list-tot-generated .tot-element a::after {
content: target-counter(attr(href), page);
float: right;
}

#list-tot-generated .tot-element-level-1 {
margin-top: 25px;
font-weight: bold;
}

#list-tot-generated .tot-element-level-2 {
margin-left: 25px;
}

/* counters */

#list-tot-generated {
counter-reset: counterTocLevel1;
}



#list-tot-generated .tot-element-level-1 {
counter-increment: counterTocLevel1;
counter-reset: counterTocLevel2;
}

#list-tot-generated .tot-element-level-1::before {
content: counter(counterTocLevel1) ". ";
padding-right: 5px;
}

#list-tot-generated .tot-element-level-2 {
counter-increment: counterTocLevel2;
}

#list-tot-generated .tot-element-level-2::before {
content: counter(counterTocLevel1) ". " counter(counterTocLevel2) ". ";
padding-right: 5px;
}

/* hack for leaders */

#list-tot-generated {
overflow-x: hidden;
}

/* fake leading */
#list-tot-generated .tot-element::after {
content: ".............................................."
".............................................."
".............................................." "........";
float: left;
width: 0;
padding-left: 5px;
letter-spacing: 2px;
color: #2A6EBB;
}

#list-toc-generated .toc-element {
display: flex;
}

#list-toc-generated .toc-element a::after {
position: absolute;
right: 0;
background-color: white;
padding-left: 6px;
}

#list-toc-generated .toc-element a {
right: 0;
color: #2A6EBB;
}

#list-tof-generated .tof-element {
display: flex;
}

#list-tof-generated .tof-element a::after {
position: absolute;
right: 0;
background-color: white;
padding-left: 6px;
}

#list-tof-generated .tof-element a {
right: 0;
color: #2A6EBB;
}

#list-tot-generated .tot-element {
display: flex;
}

#list-tot-generated .tot-element a::after {
position: absolute;
right: 0;
background-color: white;
padding-left: 6px;
}

#list-tot-generated .tot-element a {
right: 0;
color: #2A6EBB;
}

.prosemirror-editor-wrapper.embedded .ProseMirror {
 width : unset;
}
 .ProseMirror {
  box-shadow: none;
  contain: none;
  overflow: visible;
 } 
.pagedjs_pagebox,
.pagedjs_page {
  background-color: #ffffff;
 }
}`);

  // Mark the inserted style for easy removal on next call
  const insertedStyle = this['polisher'].insert(text);
  if (insertedStyle) {
    insertedStyle.dataset.licitPdfHandler = 'true';
  }

  // Reset the done flag to allow regeneration
  this.done = false;
}

  finalizePage() {
    if (!PDFHandler.state.isOnLoad) PDFHandler.state.currentPage++;
  }
}
