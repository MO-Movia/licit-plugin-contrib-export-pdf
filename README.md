


# CAPCO Plugin!
ProseMirror Based CAPCO Plugin 
## Getting Started  

### Getting repository

```
git clone https://portal.modusoperandi.com/bitbucket/scm/blademodules5/maw-licit.git
```
### Install dependencies
```
npm install
``` 
### To build the distribution files
```
# At the working directory `mo-licit-capco`
npm run build:dist 
```
### To build the capco pack
```
# At the working directory `mo-licit-capco`
npm pack
```  
### To publish capco
```
# At the working directory `mo-licit-capco`
npm run publish:capco
```  

**To load the styles in an Angular project:**
Either in *angular.json*, add
 *"styles": [
 "node_modules/@mo/licit-capco/dist/styles.css",
]*
OR
in the default global CSS file *src\styles.scss*, add
*@import  "~@mo/licit-capco/dist/styles.css"*
 
## Windows Specific

Use Git bash or Windows Power Shell to install build and run the project