0.1.0
- initial release

0.2.0
- support for zoom

0.2.1
- update documentation

0.3.0
- render by default at 4x to better support native zoom
- update documentation

0.4.0
- BREAKING: made `pdfjs-dist` a peer dependency
- BREAKING: [Issue 3](https://github.com/timgblack/pdf.svelte/issues/3): load `pdfjs-dist` on component mount to fix issues 
- increase default upscaling from 4x to 8x
- updated Svelte to most recent 3.x version
- updated internal `debounce` to not trigger twice on initial load

0.4.1
- fix race condition when rendering before pdfjs is loaded

0.4.2
- fix call stack error

0.5.0
- BREAKING: let Svelte generate the canvases (canvi?)
- BREAKING: update component styling to better reflect the size of whatever is outside
- BREAKING: use --border-color and --background-color on the component directly instead of creating a custom theme
- added JSDoc typing throughout

0.5.1
- automatically set workerSrc again

0.5.2
- set workerSrc correctly (again)

0.5.3
- set workerSrc correctly (again) (again)

0.5.4
- wait for pdfjs to load
