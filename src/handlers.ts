import { Handler } from 'pagedjs';
import { createToc } from './exportPdf';
export const info_Icons = [];
import { PreviewForm } from './preview';

export class MyHandler extends Handler {
  done;
  countTOC = 0;
  pageFooters: Array<HTMLElement> = [];
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.done = false;
  }

  beforeParsed(content) {
    this.pageFooters = [];
    if (PreviewForm.isToc) {
      createToc({
        content: content,
        tocElement: '.tocHead',
        titleElements: PreviewForm.tocHeader,
      });
    }
  }

  afterPageLayout(pageFragment) {

    let concatenatedValues = '';
    const infoIcons_ = info_Icons[0];
    if (infoIcons_) {
      infoIcons_.forEach(obj => {
        if (((PreviewForm.isTitle) || (PreviewForm.isToc)) && obj.key + 1 == pageFragment.dataset.pageNumber) {
          concatenatedValues += obj.value + ' ';
        } else if (!(PreviewForm.isTitle) && !(PreviewForm.isToc) && obj.key == pageFragment.dataset.pageNumber) {
          concatenatedValues += obj.value + ' ';
        }
      });
      pageFragment.style.setProperty('--pagedjs-string-last-chapTitled', `"${concatenatedValues + ' '}`);
    }
  }

  afterRendered(pages) {
    if (PreviewForm.general) {
      const infoIcon_initial = [];
      let count = 0;
      for (let i = 0; i < pages.length; i++) {
        const outerHTMLValue = pages[i].element.outerHTML;
        const parser = new DOMParser();
        const doc = parser.parseFromString(outerHTMLValue, 'text/html');
        const tocElements = doc.querySelectorAll('infoicon');
        tocElements.forEach(element => {
          count++;
          const description = element.attributes['description'].textContent;
          const cleanedDescription =
            ' ' + count + '. ' + description.replace(/<[^>]*>/g, '');
          const infoIcon_text_obj = {
            key: i + 1,
            value: cleanedDescription,
          };
          infoIcon_initial.push(infoIcon_text_obj);
        });
      }
      if (info_Icons.length === 0) {
        info_Icons.push(infoIcon_initial);
      }
    }
  }

  beforePageLayout() {
    this.doIT();
  }

  async doIT() {
    let opt;
    let opt2;
    opt2 = '.ProseMirror  infoicon { string-set: chapTitled content(text); }';
    opt = `@bottom-center {
content: string(chapTitled, last);
text-align: right;
}
@bottom-left {
content: "Page " counter(page) " of " counter(pages);
color: #000000;
}
`;

    if (!this.done) {
      const text = await this['polisher'].convertViaSheet(`@media print {@page {
${opt}
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
}
.pagedjs_page .pagedjs_margin-bottom-center>.pagedjs_margin-content::after {
  color: #000000;
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
}
@page {
.ProseMirror {
box-shadow: none;
padding: 10px;
width: fit-content;
}
.pagedjs_pagebox * {
background-color: #ffffff
}
.ProseMirror.czi-prosemirror-editor, .ProseMirror[data-layout='us_letter_portrait'] {
  min-height: auto !important;
  padding: 0px;
}
}
}`);
      this['polisher'].insert(text);
      this.done = true;
    }
  }
}
