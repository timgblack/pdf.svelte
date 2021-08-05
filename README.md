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

  // Required - either a link to the PDF, the contents wrapped in {data: YOUR DATA HERE}, or an int array
  // This is passed straight to pdfjs.getDocument
  const pdf = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

  // These classes are set on the various elements
  const classes = {
    overall: null,
    controls: null,
    container: null
  };

  const options = {
    // "paged" or "all"
    display: "paged",
    // "dark" or "light" or your own
    theme: "dark"
  };

  let zoom = 1;

  // The current page number
  let currentPage;

  // To override the text between the forward and back buttons 
  const pageNumberText = (currentPage, maximmPages) => currentPage + "/" + maximumPages;
</script>

<PDFViewer {pdf} {classes} {options} {zoom} bind:currentPage {pageNumberText}></PDFViewer>
```

## Theming
If we want to make a theme called "wacky":
```javascript
const options = {
  theme: "wacky"
};
```

```css
.pdf-svelte.theme-wacky {
  /* The main window */
  border: 5px solid green;
  background: red;
}

.pdf-svelte.theme-wacky .viewer {
  /* The container for the pdf.js canvas(es) */
  /* existing style: */
  position: relative;
  z-index: 1;
  overflow-y: scroll;
  height: 100%;
}

.pdf-svelte.theme-wacky .viewer canvas {
  /* The pdf.js canvas(es) */
  /* existing style: */
  display: block;
  margin: 0.4rem auto 0.6rem;
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
