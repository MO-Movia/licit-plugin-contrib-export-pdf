# Ability to export the editor content as pdf.

## Build

### Commands

- npm install

- npm pack

#### To use this in Licit

- npm install _@modusoperandi/licit-export-pdf_

Include plugin in licit component

- import ExportPDFPlugin
- add ExportPDFPlugin instance in licit's plugin array

```
import {ExportPDFPlugin} from  '@modusoperandi/licit-export-pdf';

const plugins = [new ExportPDFPlugin(true)]

ReactDOM.render(<Licit docID={''} plugins={plugins}/>
```
