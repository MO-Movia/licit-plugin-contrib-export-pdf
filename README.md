
# Ability to export the editor content as pdf.
  

## Build
  

### Commands
 
- npm install

- npm pack 

#### To use this in Licit

- npm install *@modusoperandi/licit-export-pdf*

Include plugin in licit component 

- import ExportPDFPlugin 
- add ExportPDFPlugin instance in licit's plugin array
- Constructor param showButton to display PDF button in toolbar or not.

```
import {ExportPDFPlugin} from  '@modusoperandi/licit-export-pdf';

const plugins = [new ExportPDFPlugin(true)]

ReactDOM.render(<Licit docID={''} plugins={plugins}/>
```