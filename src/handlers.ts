import { Handler } from 'pagedjs';
import { createTable } from './exportPdf';
import { PreviewForm } from './preview';

export class MyHandler extends Handler {
  public done;
  public countTOC = 0;
  public pageFooters: Array<HTMLElement> = [];
  public prepagesCount = 0;
  public caller;
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
    this.done = false;
    this.caller = caller;
  }

  public beforeParsed(content): void {
    this.pageFooters = [];
    this.prepagesCount = 0;
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

  public afterPageLayout(pageFragment, page): void {
    let concatenatedValues = '';
    const prepages = page?.element.querySelector('.prepages');
    if (!prepages) {

      const outerHTMLValue = page?.element.outerHTML;
      const parser = new DOMParser();
      const doc = parser.parseFromString(outerHTMLValue, 'text/html');
      const tocElements = doc?.querySelectorAll('infoicon');

      tocElements?.forEach((element) => {
        this.prepagesCount++;
        const description = element.getAttribute('description');
        const cleanedDescription = ` ${this.prepagesCount}. ${description.replace(/<\/?[\w\s="'./:;#-]+>/gi, '')}`;
        concatenatedValues += cleanedDescription + ' ';
      });

      if (tocElements?.length > 0) {
        const estimatedLines = Math.ceil(concatenatedValues.length / 80);

        // dynamically compute footer height based on lines
        const footerHeight = 20 + estimatedLines * 12;

        pageFragment.style.setProperty('--pagedjs-string-last-chapTitled', `"${concatenatedValues}"`);
        pageFragment.style.setProperty('--pagedjs-footer-height', `${footerHeight}px`);
      }
      else {
        pageFragment.style.setProperty('--pagedjs-string-last-chapTitled', '""');
      }
      let items = [];
      if (pageFragment && typeof pageFragment.querySelectorAll === 'function') {
        items = pageFragment?.querySelectorAll('[data-style-level]');
      }

      items?.forEach(el => {
        const level = parseInt(el.getAttribute('data-style-level'));
        const prefix = el.getAttribute('prefix');
        const tof = el.getAttribute('tof');
        const tot = el.getAttribute('tot');
        const isReset = el.getAttribute('reset');

        const label = [];
        for (let i = level + 1; i <= 10; i++) {
          this.counters[i] = 0;
        }
        if (isReset === 'true') {
          for (let i = 1; i <= level; i++) {
            this.counters[i] = 1;
            if (i === level) {
              this.counters[i] = 0;
            }
          }
        }
        if (tof) {
          this.counters[11]++;
          if (this.counters[11]) {
            label.push(this.counters[1]);
            label.push(this.counters[11]);
          }
        } else if (tot) {
          this.counters[12]++;
          if (this.counters[12]) {
            label.push(this.counters[1]);
            label.push(this.counters[12]);
          }
        } else {
          if (level === 1) {
            if (this.counters[1] > 0) {
              this.counters[11] = 0;
              this.counters[12] = 0;
            }
          }
          this.counters[level]++;
          for (let i = 1; i <= level; i++) {
            if (this.counters[i]) {
              label.push(this.counters[i]);
            }
          }

        }

        const counterVal = (prefix ? prefix + ' ' : '') + label.join('.');
        el.setAttribute('customcounter', counterVal + '.');
      });
    }

  }

  public beforePageLayout(): void {
    this.doIT();
  }

  public async doIT(): Promise<void> {
    const opt2 =
      '.ProseMirror  infoicon { string-set: chapTitled content(text); }';
    const opt = `@bottom-center {
  content: string(chapTitled, last);
  text-align: right;
  }
  @bottom-left {
  content: "Page " counter(page) " of " counter(pages);
  color: #000000;
  }
  `;

    let lastUpdatedStyle = '';
    if (PreviewForm['lastUpdated']) {
      lastUpdatedStyle = `@top-right {
        content: "${'Last Updated On: ' + PreviewForm['formattedDate']}";
        text-align: right;
        font-size: 11px;
        font-weight: bold;
        color: #000000;
      }`;
    }

    if (!this.done) {
      const text = await this['polisher'].convertViaSheet(`@media print {@page {
${opt}
${lastUpdatedStyle}
}
${opt2}
/* set the style for the list numbering to none */
#list-toc-generated {
list-style: none;
}

#list-toc-generated .toc-element {
break-inside: avoid;
}

#list-toc-generated .toc-element a::after {
content: target-counter(attr(href), page);
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

.pagedjs_page .pagedjs_margin-bottom-center>.pagedjs_margin-content::after {
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

@page {
 margin-bottom: var(--pagedjs-footer-height, 40px); /* fallback */
  @bottom-center {
    content: var(--pagedjs-string-last-chapTitled);
  }
.ProseMirror {
box-shadow: none;
}
.pagedjs_pagebox * {
background-color: #ffffff
}
}
}`);
      this['polisher'].insert(text);
      this.done = true;
    }
  }
}
