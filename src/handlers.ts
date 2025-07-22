import {Handler} from 'pagedjs';
import {createTable} from './exportPdf';
export const info_Icons = [];
import {PreviewForm} from './preview';

export class MyHandler extends Handler {
  public done;
  public countTOC = 0;
  public pageFooters: Array<HTMLElement> = [];
  public caller: any;

  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.done = false;
    this.caller = caller;
  }

  public beforeParsed(content): void {
    this.pageFooters = [];
  createTable({
    content: content,
    tocElement: '.tocHead',
    tofElement: '.tofHead',
    totElement: '.totHead',
    titleElements: PreviewForm.getHeadersTOC(),
    titleElementsTOF: PreviewForm.getHeadersTOF(),
    titleElementsTOT: PreviewForm.getHeadersTOT(),
  });
     const tocNodeList = PreviewForm.getTocNodes();
     const tofNodeList = PreviewForm.getTofNodes();
    const totNodeList = PreviewForm.getTotNodes();
     if (tocNodeList && tocNodeList.length >= 1) {
      const tocElementDiv = content.querySelector('.tocHead');
      if (tocElementDiv && !tocElementDiv.querySelector('h4')) {
      let headerTOC = document.createElement('h4');
      headerTOC.style.marginBottom = '40px';
      headerTOC.style.color = '#000000';
      headerTOC.textContent = 'TABLE OF CONTENTS';
      tocElementDiv.insertBefore(headerTOC, tocElementDiv.firstChild);
      }
    }
     if (tofNodeList && tofNodeList.length >= 1) {
      const tofElementDiv = content.querySelector('.tofHead');
      if (tofElementDiv && !tofElementDiv.querySelector('h4')) {
      let headerTOF = document.createElement('h4');
      headerTOF.style.marginBottom = '40px';
      headerTOF.style.color = '#000000';
      headerTOF.textContent = 'TABLE OF FIGURES';
      tofElementDiv.insertBefore(headerTOF, tofElementDiv.firstChild);
      }
    }
         if (totNodeList && totNodeList.length >= 1) {
      const totElementDiv = content.querySelector('.totHead');
      if (totElementDiv && !totElementDiv.querySelector('h4')) {
      let headerTOT = document.createElement('h4');
      headerTOT.style.marginBottom = '40px';
      headerTOT.style.color = '#000000';
      headerTOT.textContent = 'TABLE OF TABLES';
      totElementDiv.insertBefore(headerTOT, totElementDiv.firstChild);
      }
    }
  }

public afterPageLayout(pageFragment): void {
  let concatenatedValues = '';
  const infoIcons_ = info_Icons[0];

  if (infoIcons_) {
    infoIcons_.forEach((obj) => {
      const isMatchingPageNumber = obj.key == pageFragment.dataset.pageNumber;

      if (isMatchingPageNumber) {
        concatenatedValues += obj.value + ' ';
      }
    });

    pageFragment.style.setProperty(
      '--pagedjs-string-last-chapTitled',
      `"${concatenatedValues.trim()}"`
    );
  }
}

  public afterRendered(pages): void {
    info_Icons.pop();
    if (PreviewForm.isGeneral()) {
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
