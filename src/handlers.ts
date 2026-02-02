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
  private firstChapterPageIndex: number | null = null;
  private totalMainPages = 0;
  private attachmentStartPageIndex: number | null = null;
  private lastPrePageIndex: number | null = null;
  private currentAttachmentIndex = 0;
  private readonly attachmentPageCounters = new Map<number, number>();
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

      const counterVal = (prefix ?? '') + label.join('.');
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
    const markingData = PreviewForm['pageBanner'];
    const hasBannerMarking = !!markingData;

    if (hasBannerMarking) {
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


  public afterRendered(pages: PagedPage[]): void {
    this.resetLastPrePageIndex(pages);
    this.resolveFirstChapterPageIndex(pages);

    this.detectAttachments(pages);
    this.computeTotalMainPages(pages);

    this.applyPageNumbers(pages);
    this.patchTocEntries(pages);

    this.fixSplitAndIndentStyles(pages);
  }

  private resetLastPrePageIndex(pages: PagedPage[]): void {
    this.lastPrePageIndex = null;

    for (let i = 0; i < pages.length; i++) {
      if (pages[i].element.querySelector('.totHead')) {
        this.lastPrePageIndex = i;
      }
    }
  }

  private resolveFirstChapterPageIndex(pages: PagedPage[]): void {
    if (this.firstChapterPageIndex !== null) return;

    for (let i = 0; i < pages.length; i++) {
      if (pages[i].element.querySelector('[stylename="chapterTitle"]')) {
        this.firstChapterPageIndex = i; // zero-based
        return;
      }
    }
  }

  private fixSplitAndIndentStyles(pages: PagedPage[]): void {
    const getMarginLeft = (el: HTMLElement): string =>
      globalThis.getComputedStyle(el).marginLeft || '0pt';

    for (const { element: page } of pages) {
      this.fixSplitTo(page, getMarginLeft);
      this.fixSplitFrom(page, getMarginLeft);
      this.fixIndent(page, getMarginLeft);
    }
  }

  private fixSplitTo(
    page: HTMLElement,
    getMarginLeft: (el: HTMLElement) => string
  ): void {
    const el = page.querySelector<HTMLElement>('p[data-split-to]');
    if (!el) return;

    const mLeft = getMarginLeft(el);
    el.style.setProperty('margin-top', '1pt', 'important');
    el.style.setProperty('margin-left', '0pt', 'important');
    el.style.setProperty('padding-left', mLeft, 'important');
  }

  private fixSplitFrom(
    page: HTMLElement,
    getMarginLeft: (el: HTMLElement) => string
  ): void {
    const el = page.querySelector<HTMLElement>('p[data-split-from]');
    if (!el) return;

    const mLeft = getMarginLeft(el);
    el.style.setProperty('margin-left', '0pt', 'important');
    el.style.setProperty('padding-left', mLeft, 'important');
  }

  private fixIndent(
    page: HTMLElement,
    getMarginLeft: (el: HTMLElement) => string
  ): void {
    const items = page.querySelectorAll('p[data-indent]');

    for (const el of items) {
      const htmlEl = el as HTMLElement;
      const mLeft = getMarginLeft(htmlEl);
      htmlEl.style.setProperty('margin-left', '0pt', 'important');
      htmlEl.style.setProperty('padding-left', mLeft, 'important');
    }
  }


  private toRoman(num: number): string {
    if (num > 3999) {
      return String(num);
    }
    const map: [number, string][] = [
      [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'],
      [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'],
      [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']
    ];
    let result = '';
    for (const [value, numeral] of map) {
      while (num >= value) {
        result += numeral;
        num -= value;
      }
    }
    return result;
  }

  private applyPageNumbers(pages: PagedPage[]): void {
    const isAfttp = !!PreviewForm['pageBanner'];

    let normalCounter = 0;
    let activeAttachmentIndex = 0;
    let attachmentPage = 0;

    const chapters = isAfttp ? this.buildChapterRanges(pages) : [];

    let pageIndex = 0;
    for (const pageObj of pages) {
      const pageEl = pageObj.element;

      const pageNumberEl =
        pageEl.querySelector<HTMLElement>(
          '.pagedjs_margin-top-right .pagedjs_margin-content'
        );

      if (!pageNumberEl) {
        pageIndex++;
        continue;
      }

      /* ---------- NON-AFTTP ---------- */
      if (!isAfttp) {
        pageNumberEl.textContent =
          this.resolveNonAfttpPageNumber(
            pageIndex,
            () => ++normalCounter
          );
        pageIndex++;
        continue;
      }

      /* ---------- AFTTP ---------- */
      pageNumberEl.textContent =
        this.resolveAfttpPageNumber(
          pageEl,
          pageIndex,
          chapters,
          () => {
            activeAttachmentIndex++;
            attachmentPage = 1;
            return `A${activeAttachmentIndex}-${attachmentPage}`;
          },
          () => {
            if (activeAttachmentIndex > 0) {
              attachmentPage++;
              return `A${activeAttachmentIndex}-${attachmentPage}`;
            }
            return '';
          }
        );

      pageIndex++;
    }
  }

  private resolveNonAfttpPageNumber(
    pageIndex: number,
    nextNormal: () => number
  ): string {
    const isPrePage =
      this.lastPrePageIndex !== null &&
      pageIndex <= this.lastPrePageIndex;

    if (isPrePage) {
      return this.toRoman(pageIndex + 1);
    }

    return String(nextNormal());
  }

  private resolveAfttpPageNumber(
    pageEl: HTMLElement,
    pageIndex: number,
    chapters: Array<{ start: number; end: number; chapterIndex: number }>,
    onAttachmentStart: () => string,
    onAttachmentContinue: () => string
  ): string {
    if (pageEl.querySelector('[stylename="attachmentTitle"]')) {
      return onAttachmentStart();
    }

    if (onAttachmentContinue) {
      const continued = onAttachmentContinue();
      if (continued) {
        return continued;
      }
    }

    const chapter = chapters.find(
      c => pageIndex >= c.start && pageIndex < c.end
    );

    if (chapter) {
      const pageInChapter = pageIndex - chapter.start + 1;
      return `${chapter.chapterIndex}-${pageInChapter}`;
    }

    return this.toRoman(pageIndex + 1);
  }

  private buildChapterRanges(pages: PagedPage[]) {
    const chapters: Array<{
      start: number;
      end: number;
      chapterIndex: number;
    }> = [];

    let chapterIndex = 0;

    for (let i = 0; i < pages.length; i++) {
      if (pages[i].element.querySelector('[stylename="chapterTitle"]')) {
        const lastChapter = chapters.at(-1);
        if (lastChapter) {
          lastChapter.end = i;
        }

        chapterIndex++;

        chapters.push({
          start: i,
          end: pages.length,
          chapterIndex,
        });
      }
    }

    const lastChapter = chapters.at(-1);
    if (lastChapter) {
      lastChapter.end = pages.length;
    }

    return chapters;
  }

  private detectAttachments(pages: PagedPage[]): void {
    this.currentAttachmentIndex = 0;
    this.attachmentPageCounters.clear();

    for (let i = 0; i < pages.length; i++) {
      const pageEl = pages[i].element;

      const attachmentTitle = pageEl.querySelector(
        '[stylename="attachmentTitle"]'
      );

      if (attachmentTitle) {
        this.currentAttachmentIndex++;
        this.attachmentStartPageIndex = i;
        this.attachmentPageCounters.set(this.currentAttachmentIndex, 0);
      }

      if (this.currentAttachmentIndex > 0) {
        const count = this.attachmentPageCounters.get(this.currentAttachmentIndex) ?? 0;
        this.attachmentPageCounters.set(this.currentAttachmentIndex, count + 1);
      }
    }
  }

  private computeTotalMainPages(pages: PagedPage[]): void {
    if (this.firstChapterPageIndex === null) return;

    let endIndex = pages.length - 1;

    // STOP at first attachment
    for (let i = 0; i < pages.length; i++) {
      if (pages[i].element.querySelector('[stylename="attachmentTitle"]')) {
        endIndex = i - 1;
        break;
      }
    }

    this.totalMainPages =
      endIndex >= this.firstChapterPageIndex
        ? endIndex - this.firstChapterPageIndex + 1
        : 0;
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
          refToPage.set(ref, pageIndex);
        }
      }
    }

    return refToPage;
  }

  private applyTocPageNumbers(
    pages: PagedPage[],
    refToPage: Map<string, number>
  ): void {
    const isAfttp = !!PreviewForm['pageBanner'];

    const attachments = isAfttp
      ? this.buildAttachmentRanges(pages)
      : [];

    const chapters = isAfttp
      ? this.buildChapterRanges(pages)
      : [];

    for (const pageObj of pages) {
      const links = pageObj.element.querySelectorAll(
        '.toc-element a, .tof-element a, .tot-element a'
      );

      for (const link of links) {
        this.applySingleTocLink(
          link,
          refToPage,
          isAfttp,
          attachments,
          chapters
        );
      }
    }
  }

  private applySingleTocLink(
    link: Element,
    refToPage: Map<string, number>,
    isAfttp: boolean,
    attachments: Array<{ start: number; end: number; index: number }>,
    chapters: Array<{ start: number; end: number; chapterIndex: number }>
  ): void {
    if (!(link instanceof HTMLElement)) return;

    const id = link.getAttribute('href')?.slice(1);
    if (!id) return;

    const pageIndex = refToPage.get(id);
    if (pageIndex === undefined) return;

    if (!isAfttp) {
      link.dataset.page = this.getNonAfttpPageNumber(pageIndex);
      return;
    }

    const afttpPage = this.getAfttpPageNumber(
      pageIndex,
      attachments,
      chapters
    );

    link.dataset.page = afttpPage;
  }

  private getNonAfttpPageNumber(pageIndex: number): string {
    if (
      this.lastPrePageIndex !== null &&
      pageIndex <= this.lastPrePageIndex
    ) {
      return this.toRoman(pageIndex + 1);
    }

    const pageNumber =
      this.lastPrePageIndex === null
        ? pageIndex + 1
        : pageIndex - this.lastPrePageIndex;

    return String(pageNumber);
  }

  private getAfttpPageNumber(
    pageIndex: number,
    attachments: Array<{ start: number; end: number; index: number }>,
    chapters: Array<{ start: number; end: number; chapterIndex: number }>
  ): string {
    const attachment = attachments.find(
      a => pageIndex >= a.start && pageIndex < a.end
    );

    if (attachment) {
      const pageInAttachment = pageIndex - attachment.start + 1;
      return `A${attachment.index}-${pageInAttachment}`;
    }

    const chapter = chapters.find(
      c => pageIndex >= c.start && pageIndex < c.end
    );

    if (chapter) {
      const pageInChapter = pageIndex - chapter.start + 1;
      return `${chapter.chapterIndex}-${pageInChapter}`;
    }

    return this.toRoman(pageIndex + 1);
  }


  private buildAttachmentRanges(
    pages: PagedPage[]
  ): Array<{ start: number; end: number; index: number }> {
    const attachments: Array<{ start: number; end: number; index: number }> = [];

    let currentStart: number | null = null;
    let attachmentIndex = 0;

    for (let i = 0; i < pages.length; i++) {
      if (!pages[i].element.querySelector('[stylename="attachmentTitle"]')) {
        continue;
      }

      if (currentStart !== null) {
        const lastAttachment = attachments.at(-1);
        if (lastAttachment) {
          lastAttachment.end = i;
        }
      }
      attachmentIndex++;
      currentStart = i;

      attachments.push({
        start: i,
        end: pages.length,
        index: attachmentIndex,
      });
    }

    if (currentStart !== null) {
      const lastAttachment = attachments.at(-1);
      if (lastAttachment) {
        lastAttachment.end = pages.length;
      }
    }

    return attachments;
  }



  private formatLongDate(dateStr: string): string {
    const date = new Date(dateStr);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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
    const markingData = PreviewForm['pageBanner'];
    const hasBannerMarking = !!markingData;
    const rawTitle = PreviewForm['documentTitle'] ?? '';
    const truncatedTitle = this.truncateTitle(rawTitle);

    const formattedDate = PreviewForm['formattedDate']
      ? this.formatLongDate(PreviewForm['formattedDate'])
      : '';

    const titleData = formattedDate
      ? `${truncatedTitle}, ${formattedDate}`
      : truncatedTitle;

    let nonAfttpFooterColor = '';
    let opt = '';
    let opt2 = '';
    let pageOverride = '';
    let headerTitleContent = '';

    // 🔥 CLEAR ALL FOOTER-RELATED STYLES WHEN SWITCHING MODES
    document.documentElement.style.removeProperty('--pagedjs-string-last-chapTitled');
    document.documentElement.style.removeProperty('--pagedjs-footer-height');

    // Remove previously injected styles to avoid conflicts
    const currentMode = markingData ? 'afttp' : 'non-afttp';

    if (PDFHandler.lastMode !== currentMode) {
      const existingStyles = document.querySelectorAll(
        'style[data-licit-pdf-handler]'
      );
      for (const style of existingStyles) {
        style.remove();
      }
      PDFHandler.lastMode = currentMode;
    }

    if (!hasBannerMarking) {
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

    if (hasBannerMarking && markingData) {
      if (titleData) {
        headerTitleContent = `
      @top-left {
        content: "${titleData}";
        font-family: "Times New Roman", Times, serif;
        font-size: 12pt;
        text-align: left;
        padding-top: 60px;
        color: #000000;
        font-weight: bold;
        letter-spacing: 0.2px;
      }
    `;
      }
      opt = `
      @top-center {
        content: "${markingData.text}";
        font-family: "Times New Roman", Times, serif;
        font-size: 14pt;
        text-align: center;
        color: ${markingData.color};
      }

      @bottom-center {
        content: "${markingData.text}";
        font-family: "Times New Roman", Times, serif;
        font-size: 14pt;
        text-align: center;
        color: ${markingData.color};
        padding-top: 72px;
        padding-right: 88px;
      }

      @top-right {
        content: "";
        padding-top: 60px;
        font-family: "Times New Roman", Times, serif;
        font-size: 12pt;
        color: #000000;
        font-weight: bold;
        letter-spacing: 0.2px;
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

      @top-right {
        content: "";
        padding-top: 60px;
        font-family: "Times New Roman", Times, serif;
        font-size: 12pt;
        color: #000000;
        font-weight: normal;
        letter-spacing: 0.2px;
      }
    `;
    }

    // Always regenerate styles to ensure correct mode
    const text = await this['polisher'].convertViaSheet(`@media print {@page {
${opt}
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
  content: attr(data-page);
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
  content: attr(data-page);
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
