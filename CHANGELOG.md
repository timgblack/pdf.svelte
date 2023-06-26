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