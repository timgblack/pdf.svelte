# pdf.svelte
The problem: native PDF viewers are great, but they sometimes have subtle bugs which make cross-platform sites unreliable.

The solution: pdf.js wrapped in a component to abstract away all the low-level setup.

# Getting Started

## Installation
Using NPM:
```
npm install pdf.svelte
```

## Usage
```svelte
<script>
  import PDFViewer from 'pdf.svelte';

  // Required - the URL of your PDF, {data: pdfContents}, an ArrayBuffer or TypedArray (like Uint8Array), or a pdfjs DocumentInitParameters
  // This is passed straight to pdfjs.getDocument
  const pdf = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

  // These classes are set on the various elements
  const classes = {
    overall: null,
    controls: null,
    container: null
  };

  const options = {
    // paged - display a single page with controls
    // all - display all pages
    display: "paged",
    // dark - grey on darkgrey
    // light - grey on lightgrey
    // your own theme name - whatever you like
    theme: "dark",
    // allow double click/tap to zoom between 1 and 1.5x
    autoZoomEnabled: false,
    // baseline superscale resolution to render
    // larger means better zoom, but slower rendering
    upscale: 8,
    // horizontal - fit width
    // vertical - fit height
    // both - fit the smaller of width and height
    fit: "both"
  };

  // Control over the zoom level of the document
  // Zoom is > 0 and represents the zoom level (1 = 100% etc)
  // zoomIn and zoomOut move zoom through the following levels:
  // [0.1, 0.25, 0.5, 0.66, 0.8, 0.9, 1, 1.2, 1.5, 2, 3, 4, 5]
  // If zoom is between two levels, it will align to the nearest:
  // zoom >= 1 and < 2 will zoom in to 1.2
  // zoom > 1 and <= 2 will zoom out to 1
  let zoom = 1, zoomIn, zoomOut;

  // The current page number
  let currentPage;

  // To override the text between the forward and back buttons
  const pageNumberText = (currentPage, totalPages) => `${currentPage}/${totalPages}`;

  // To set your own theme colours without writing your own theme
  const borderColor = "grey";
  const backgroundColor = "darkgrey";
</script>

<PDFViewer {pdf} {classes} {options} {zoom} bind:zoomIn bind:zoomOut {pageNumberText} bind:currentPage --border-color={borderColor} --background-color={backgroundColor}></PDFViewer>
```

## Theming
### Just Border/Background
```javascript
<script>
  const borderColor = "green";
  const backgroundColor = "red";
</script>
<PDFViewer --border-color={borderColor} --background-color={backgroundColor}>
```
### Fully Custom
If we want to make a theme called `wacky`:
```javascript
const options = {
  theme: "wacky"
};
```

```css
.pdf-svelte.theme-wacky {
  /* The main window */
  --border-color: green;
  --background-color: red;
  /* existing styles: */
  position: relative;
  z-index: 1;
  overflow-y: auto;
  height: 100%;
  width: 100%;
}

.pdf-svelte.theme-wacky .viewer {
  /* The container for the pdf.js canvas(es) */
  /* existing style: */
  position: relative;
  z-index: 1;
  overflow-y: auto;
  height: 100%;
  width: 100%;
}

.pdf-svelte.theme-wacky .viewer canvas {
  /* The pdf.js canvas(es) */
  /* existing style: */
  display: block;
  margin: 0 auto;
  border: 1px solid var(--border-color);
}

.pdf-svelte.theme-wacky .controls {
  /* If you use the paged display mode, this is the controls */
  /* existing style: */
  position: absolute;
  width: 100%;
  bottom: 0;
  text-align: center;
  z-index: 2;
  border-radius: 50%;
}
```
