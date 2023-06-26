<script>
    import { createEventDispatcher, onMount } from 'svelte';

    const dispatch = createEventDispatcher();

    let pdfjs;
    onMount(async () => {
        pdfjs = await import("pdfjs-dist");
        await import("pdfjs-dist/build/pdf.worker.entry");
    });

    function debounce(func, timeout = 500) {
        let timer;
        return (...args) => {
            if (!timer) { // First call is leading edge (call immediately)
                func.apply(this, args);
                timer = setTimeout(() => timer = undefined, timeout);
            } else { // Subsequent calls are trailing edge (wait until they stop)
                clearTimeout(timer);
                timer = setTimeout(() => {
                    func.apply(this, args);
                    timer = undefined;
                }, timeout);
            }
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
        autoZoomEnabled: false,
        upscale: 4,
        pdfjs: {},
    };

    $: opts = {...defaultOptions, ...options}
    $: if (zoom <= 0) zoom = 1;

    let pageContainer = null;
    let doc = null;
    let numPages = 0;
    let pages = [];

    let oldZoom = 0;

    const render = debounce(async (src) => {
        doc = null;
        pages = null;

        if (!src)
            return;

        if (!pdfjs) {
            // using the debounce behaviour to retry after pdfjs is loaded (hopefully)
            render(src);
            return;
        }

        doc = await pdfjs.getDocument(src).promise;

        numPages = doc.numPages;

        // Load every page asynchronously
        pages = (await Promise.all(
            Array.from(Array(numPages).keys(), pageNum => doc.getPage(pageNum + 1))
        )).map(page => {
            const canvas = document.createElement('canvas');
            canvas.classList = getComponentClass();

            let viewport = page.getViewport({ scale: 1 });

            const boundingRect = pageContainer.getBoundingClientRect();
            const pageScale = Math.min(
                boundingRect.width / viewport.width,
                boundingRect.height / viewport.height,
            );

            viewport = viewport.clone({ scale: pageScale * opts.upscale / zoom });

            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.style.height = `${viewport.height / opts.upscale}px`;
            canvas.style.width = `${viewport.width / opts.upscale}px`;

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
        if (config.autoZoomEnabled)
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
