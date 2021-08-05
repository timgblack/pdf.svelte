<script>
    // import * as pdfjs from 'pdfjs-dist';
    import pdfjs from "@bundled-es-modules/pdfjs-dist/build/pdf";
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@2.5.207/build/pdf.worker.min.js";

    function debounce(func, timeout = 500) {
        let timer;
        return (...args) => {
            // Run on both leading and tailing edge
            if (!timer) func.apply(this, args);
            clearTimeout(timer);
            timer = setTimeout(() => { func.apply(this, args); }, timeout);
        };
    }

    export let pdf;
    // checks "overall", "controls" and "container"
    export let classes = {};
    export let options = {};
    export let zoom = 1;
    export let currentPage = 1;
    export let pageNumberText = (currentPage, maximumPages) => currentPage + "/" + maximumPages;

    const defaultOptions = {
        // paged, all
        display: "paged",
        // dark, light
        theme: 'dark',
        scale: 1,
        pdfjs: {},
    };

    $: opts = {...defaultOptions, ...options}
    $: if (zoom <= 0) zoom = 1;

    let pageContainer = null;
    let doc = null;
    let numPages = 0;
    let pages = [];

    let oldZoom = 0;

    const render = debounce(async () => {
        console.log("Rendering", pdf);
        doc = null;
        pages = null;

        if (!pdf)
            return;

        doc = await pdfjs.getDocument(pdf).promise;

        numPages = doc.numPages;

        // Load every page asynchronously
        pages = (await Promise.all(
            Array.from(Array(numPages).keys(), pageNum => doc.getPage(pageNum + 1))
        )).map(page => {
            const canvas = document.createElement('canvas');
            canvas.classList = getComponentClass();

            let viewport = page.getViewport({ scale: 1 / zoom, });
            const boundingRect = pageContainer.getBoundingClientRect();
            const pageScale = Math.min(
                boundingRect.width / viewport.width,
                boundingRect.height / viewport.height,
            );

            viewport = viewport.clone({ scale: pageScale });

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const context = canvas.getContext('2d');

            page.render({
                canvasContext: context,
                viewport: viewport
            });

            return canvas;
        });

        oldZoom = zoom;
        dispatch("ready");
    });

    $: render(pdf);
    $: if (zoom && oldZoom && zoom != oldZoom) {
        render(pdf);
        oldZoom = zoom;
    }

    $: if (pageContainer && pages) {
        pageContainer.innerHTML = "";
        if (opts.display == "paged") {
            let page = pages[currentPage - 1]
            pageContainer.append(page);
        } else {
            currentPage = 1;
            pages.forEach(page => pageContainer.append(page));
        }
    }

    export const navigateLeft = () => {
        currentPage = Math.max(currentPage - 1, 1);
    }

    export const navigateRight = () => {
        currentPage = Math.min(currentPage + 1, numPages);
    }

    function getPageText(currentPage, numPages) {
        return pageNumberText(currentPage, numPages);
    }

    function getComponentClass() {
        return Array.from(pageContainer.classList).filter(c => c.startsWith("svelte"))[0];
    }

    function generateClasses() {
        return Array.from(arguments).filter(a => a).join(" ");
    }

    // Zoom
    const zoomLevels = [0.1, 0.25, 0.5, 0.66, 0.8, 0.9, 1, 1.2, 1.5, 2, 3, 4, 5];
    function adjustZoom(offset) {
        const currentIndex = zoomLevels.indexOf(zoom);
        let newLevel = currentIndex + offset;
        if (newLevel < 0) newLevel = 0;
        if (newLevel >= zoomLevels.length) newLevel = zoomLevels.length - 1;
        zoom = zoomLevels[newLevel];
    }

    export function zoomIn() {
        adjustZoom(1);
    }

    export function zoomOut() {
        adjustZoom(-1);
    }

    const autoZoomMin = 1, autoZoomMax = 1.5;
    function autoZoom() {
        zoom = autoZoomMin >= zoom && zoom < autoZoomMax ? autoZoomMax : autoZoomMin;
    }
</script>

<style>
.pdf-svelte {
    position: absolute;
}

canvas {
    display: block;
    padding: 0.4rem 0 0.6rem;
    margin: 0 auto;
}

.viewer {
    position: relative;
    z-index: 1;
    overflow-y: scroll;
    height: 100%;
}

.controls {
    position: absolute;
    width: 100%;
    bottom: 0;
    text-align: center;
    z-index: 2;
    border-radius: 50%;
}

.controls button {
}

.display-all .controls {
    display: none;
}

.theme-dark {
    border: 5px solid grey;
    background: darkgrey;
}

.theme-light {
    border: 5px solid grey;
    background: lightgrey;
}
</style>

<div class={generateClasses("pdf-svelte", "theme-" + opts.theme, "display-" + opts.display, classes.overall)}>
    <slot>
        <div class={generateClasses("controls", classes.controls)}>
            <button on:click={navigateLeft}>Previous</button>
            {getPageText(currentPage, numPages)}
            <button on:click={navigateRight}>Next</button>
        </div>
    </slot>
    <div bind:this={pageContainer} on:dblclick={autoZoom} class={generateClasses("viewer", classes.container)}>
        <canvas></canvas>
    </div>
</div>
