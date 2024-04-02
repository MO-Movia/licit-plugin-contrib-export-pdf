import {Handler, Paged} from 'pagedjs';
import createToc from './exportPdf';
import {Option} from './preview';
export let Array = [];

class MyHandler extends Handler {
  done;
  countTOC = 0;
  pageFooters: Array<HTMLElement> = [];
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.done = false;
  }

  beforeParsed(content) {
    this.pageFooters = [];
    if (Option.includes(2)) {
      createToc({
        content: content,
        tocElement: '.tocHead',
        titleElements: ['Chapter Header'],
      });
    }
  }

  afterPageLayout(pageFragment, page) {
    if (Option.includes(3)) {
      let concatenatedValues = '';
      let object = Array[0];
      object.forEach(obj => {
        if (Option.includes(2)) {
          if (obj.key + 1 == pageFragment.dataset.pageNumber) {
            concatenatedValues += obj.value + ' ';
          }
        } else {
          if (obj.key == pageFragment.dataset.pageNumber) {
            concatenatedValues += obj.value + ' ';
          }
        }
      });
      pageFragment.style.setProperty(
        `--pagedjs-string-last-chapTitled`,
        `"${concatenatedValues + ' '}`
      );
    }
    // if (Option.includes(2)) {
    //   this.setPageNumberFooter(pageFragment);
    // }
  }

  // setPageNumberFooter(pageFragment) {
  //   const tocEle = pageFragment.querySelector(
  //     '.pagedjs_sheet .pagedjs_pagebox .pagedjs_page_content .tocHead'
  //   );

  //   const pageNumber = pageFragment.dataset.pageNumber;
  //   const footerElement = pageFragment.querySelector(
  //     '.pagedjs_sheet .pagedjs_pagebox .pagedjs_margin-bottom .pagedjs_margin-bottom-left .pagedjs_margin-content'
  //   );

  //   if (footerElement) {
  //     let innerHTML = '';
  //     if (tocEle) {
  //       this.countTOC++;
  //       const romanNumeral = this.convertToRoman(parseInt(pageNumber, 10));
  //       innerHTML = `Page ${romanNumeral}`;
  //     } else {
  //       innerHTML = `Page ${pageNumber - this.countTOC}`;
  //     }
  //     footerElement.innerHTML = innerHTML;
  //     this.pageFooters.push(footerElement);
  //   }
  // }

  // finalizeFooter(pageCount) {
  //   let excount = 0;
  //   let orgCount = pageCount - this.countTOC;
  //   this.pageFooters.forEach(pageFooter => {
  //     if (excount < this.countTOC) {
  //       pageFooter.innerHTML = pageFooter.innerHTML;
  //     } else {
  //       pageFooter.innerHTML = pageFooter.innerHTML + ' of ' + orgCount;
  //     }
  //     excount++;
  //   });
  // }

  // convertToRoman(num) {
  //   const romanMap = [
  //     {value: 1000, roman: 'M'},
  //     {value: 900, roman: 'CM'},
  //     {value: 500, roman: 'D'},
  //     {value: 400, roman: 'CD'},
  //     {value: 100, roman: 'C'},
  //     {value: 90, roman: 'XC'},
  //     {value: 50, roman: 'L'},
  //     {value: 40, roman: 'XL'},
  //     {value: 10, roman: 'X'},
  //     {value: 9, roman: 'IX'},
  //     {value: 5, roman: 'V'},
  //     {value: 4, roman: 'IV'},
  //     {value: 1, roman: 'I'},
  //   ];
  //   let roman = '';
  //   for (let i = 0; i < romanMap.length; i++) {
  //     while (num >= romanMap[i].value) {
  //       roman += romanMap[i].roman;
  //       num -= romanMap[i].value;
  //     }
  //   }
  //   return roman;
  // }

  afterRendered(pages) {
    if (Option.includes(1)) {
      let tocObjects = [];
      let count = 0;
      for (let i = 0; i < pages.length; i++) {
        const outerHTMLValue = pages[i].element.outerHTML;
        const parser = new DOMParser();
        const doc = parser.parseFromString(outerHTMLValue, 'text/html');
        let tocElements = doc.querySelectorAll(`infoicon`);
        tocElements.forEach(element => {
          count++;
          let description = element.attributes['description'].textContent;
          let cleanedDescription =
            ' ' + count + '. ' + description.replace(/<[^>]*>/g, '');
          let obj = {
            key: i + 1,
            value: cleanedDescription,
          };
          tocObjects.push(obj);
        });
      }
      Array.push(tocObjects);
    }
    // if (Option.includes(2)) {
    //   this.finalizeFooter(pages.length);
    // }
  }

  beforePageLayout(pageElement, page, breakToken) {
    this.doIT();
  }

  async doIT() {
    let opt;
    let opt2;
    if (Option.includes(3) && Option.includes(2)) {
      opt2 = `.ProseMirror  infoicon { string-set: chapTitled content(text); }`;
      opt = `@bottom-center{
content: string(chapTitled, last);
text-align: right;
}
@bottom-left {
content: "Page " counter(page) " of " counter(pages);
}
`;
    } else if (Option.includes(3)) {
      opt2 = `.ProseMirror  infoicon { string-set: chapTitled content(text); }`;
      opt = `@bottom-center{
content: string(chapTitled, last);
text-align: right;
}
@bottom-left {
content: "Page " counter(page) " of " counter(pages);
}
`;
    } else if (Option.includes(2)) {
      opt = ` @bottom-left {
content: "Page " counter(page) " of " counter(pages);
}`;
      opt2 = '';
    } else {
      opt = ` @bottom-left {
            content: "Page " counter(page) " of " counter(pages);
          }`;
      opt2 = '';
    }

    if (!this.done) {
      let text = await this['polisher'].convertViaSheet(`@media print {@page {
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
content: " p. " target-counter(attr(href), page);
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
}
}
}`);
      this['polisher'].insert(text);
      this.done = true;
    }
  }
}

export default MyHandler;
