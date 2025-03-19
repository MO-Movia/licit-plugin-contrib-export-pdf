import {Handler} from 'pagedjs';
import {createToc} from './exportPdf';
export const info_Icons = [];
import {PreviewForm} from './preview';

export class MyHandler extends Handler {
  public done;
  public countTOC = 0;
  public pageFooters: Array<HTMLElement> = [];

  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.done = false;
  }

  public beforeParsed(content): void {
    this.pageFooters = [];
    if (PreviewForm['isToc']) {
      createToc({
        content: content,
        tocElement: '.tocHead',
        titleElements: PreviewForm['tocHeader'],
      });
    }
  }

  public afterPageLayout(pageFragment): void {
    let concatenatedValues = '';
    const infoIcons_ = info_Icons[0];
    if (infoIcons_) {
      infoIcons_.forEach((obj) => {
        const isTitleOrToc = PreviewForm['isTitle'] || PreviewForm['isToc'];
        const isMatchingPageNumber = obj.key == pageFragment.dataset.pageNumber;

        if (
          (isTitleOrToc && obj.key + 1 == pageFragment.dataset.pageNumber) ||
          (!isTitleOrToc && isMatchingPageNumber)
        ) {
          concatenatedValues += obj.value + ' ';
        }
      });
      pageFragment.style.setProperty(
        '--pagedjs-string-last-chapTitled',
        `"${concatenatedValues + ' '}`
      );
    }
  }

  public afterRendered(pages): void {
    info_Icons.pop();
    if (PreviewForm['general']) {
      const infoIcon_initial = [];
      let count = 0;
      for (let i = 0; i < pages.length; i++) {
        const outerHTMLValue = pages[i].element.outerHTML;
        const parser = new DOMParser();
        const doc = parser.parseFromString(outerHTMLValue, 'text/html');
        const tocElements = doc.querySelectorAll('infoicon');
        tocElements.forEach((element) => {
          count++;
          const description = element.attributes['description'].textContent;
          const cleanedDescription = ' ' + count + '. ' + description.replace(/<\/?[\w\s="'./:;#-]+>/gi, '');
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

.tocHead{
  margin-bottom: 700px;
}
.titleHead{
  margin-bottom: 700px;
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
color: #000000;
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
color: blue;
}
.prosemirror-editor-wrapper.embedded .ProseMirror {
 width : unset;
}

@page {
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
