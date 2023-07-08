<script>
    import { createEventDispatcher, onMount, tick } from 'svelte';

    const dispatch = createEventDispatcher();

    /** @type {import("pdfjs-dist")} */
    let pdfjs;
    /** @type {(value?: any) => void} */
    let pdfjsSetLoaded;
    /** @type {Promise<void>} */
    let pdfjsLoaded = new Promise(r => pdfjsSetLoaded = r);
    onMount(async () => {
        pdfjs = await import("pdfjs-dist");
        if (!pdfjs.GlobalWorkerOptions.workerSrc)
            pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
        pdfjsSetLoaded();
    });

    /**
     * @function
     * @template {function(...*): void} TFunc
     * @param {TFunc} func
     * @param {number} timeout
     * @returns {TFunc}
     * @this {*}
    */
    function debounce(func, timeout = 500) {
        /** @type {undefined | ReturnType<setTimeout>} */
        let timer;
        // @ts-ignore
        return (...args) => {
            if (!timer) { // First call is leading edge (call immediately)
                timer = setTimeout(() => timer = undefined, timeout);
                func(...args);
            } else { // Subsequent calls are trailing edge (wait until they stop)
                clearTimeout(timer);
                timer = setTimeout(() => {
                    func(...args);
                    timer = undefined;
                }, timeout);
            }
        };
    }

    /** @typedef {{
     *     display: "paged" | "all",
     *     theme: "none" | "light" | "dark" | string,
     *     autoZoomEnabled: boolean,
     *     upscale: number,
     *     fit: "horizontal" | "vertical" | "both"
     * }} Options */
    /** @typedef {string | URL | ArrayBuffer 
     *     | import("pdfjs-dist/types/src/display/api").TypedArray
     *     | import("pdfjs-dist/types/src/display/api").DocumentInitParameters
     * } PDFSource */

    /** @type {Options} */
    const defaultOptions = {
        // paged, all
        display: "paged",
        // dark, light, none
        theme: 'dark',
        autoZoomEnabled: false,
        upscale: 8,
        // horizontal, vertical, both
        fit: "both"
    };

    /** @type {PDFSource} */
    export let pdf;
    // checks "overall", "controls" and "container"
    /** @type {Partial<{overall: string[], controls: string[], container: string[]}>} */
    export let classes = {};
    /** @type {Partial<Options>}*/
    export let options = defaultOptions;
    /** @type {number} */
    export let zoom = 1;
    /** @type {number} */
    export let currentPage = 1;
    /** @function
     * @param {number} currentPage
     * @param {number} totalPages
     * @returns {string}
    */
    export let pageNumberText = (currentPage, totalPages) => `${currentPage}/${totalPages}`;

    /** @type {Options} */
    let opts;
    $: opts = {...defaultOptions, ...options}
    $: if (zoom <= 0) zoom = 1;

    /** @type {HTMLDivElement} */
    let pageContainer;
    /** @type {import("pdfjs-dist").PDFDocumentProxy} */
    let doc;
    /** @type {number} */
    let numPages = 0;
    /** @type {HTMLCanvasElement[]} */
    let pages = [];

    /** @type {number} */
    let oldZoom = 0;

    /** @function
     * @param {PDFSource} src
     * @returns {void}
    */
    const render = debounce(/** @function @param {PDFSource} src */ async (src) => {

        if (!src)
            return;

        await pdfjsLoaded;

        doc = await pdfjs.getDocument(src).promise;

        numPages = doc.numPages;
        await tick();

        // Load every page 
        await Promise.all(pages.map(async (canvas, pageNum) => {
            const page = await doc.getPage(pageNum + 1);
            let viewport = page.getViewport({ scale: 1 });

            const boundingRect = pageContainer.getBoundingClientRect();
            const pageScale = Math.min(
                boundingRect.width / viewport.width,
                boundingRect.height / viewport.height,
            );

            viewport = viewport.clone({ scale: pageScale * opts.upscale / zoom });

            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.style.aspectRatio = `${viewport.width} / ${viewport.height}`;

            const context = /** @type {CanvasRenderingContext2D} */(canvas.getContext('2d'));

            page.render({
                canvasContext: context,
                viewport: viewport
            });
        }));

        oldZoom = zoom;
        dispatch("ready");
    });

    $: render(pdf);
    $: if (zoom  && oldZoom && zoom != oldZoom) {
        render(pdf);
        oldZoom = zoom;
    }

    /** @function @description Navigate to the previous page */
    export const navigateLeft = () => {
        currentPage = Math.max(currentPage - 1, 1);
    }

    /** @function @description Navigate to the next pages */
    export const navigateRight = () => {
        currentPage = Math.min(currentPage + 1, numPages);
    }

    // Zoom
    const zoomLevels = [0.1, 0.25, 0.5, 0.66, 0.8, 0.9, 1, 1.2, 1.5, 2, 3, 4, 5];

    /**
     * @function
     * @param {-1 | 1 | number} offset - the number of predefined zoom steps to move
    */
    function adjustZoom(offset) {
        const currentIndex = (() => {
            let i = 0;
            while (i < zoomLevels.length && zoomLevels[i] < zoom){
                i++;
            }
            if (zoom != zoomLevels[i] && offset > 0) --i;
            return i;
        })();
        const newLevel = Math.min(Math.max(currentIndex + offset, 0), zoomLevels.length - 1);
        zoom = zoomLevels[newLevel];
    }

    /** @function @description Zoom in one step */
    export function zoomIn() {
        adjustZoom(1);
    }

    /** @function @description Zoom out one step */
    export function zoomOut() {
        adjustZoom(-1);
    }

    const autoZoomMin = 1, autoZoomMax = 1.5;
    function autoZoom() {
        if (opts.autoZoomEnabled) {
            zoom = zoom < autoZoomMin || zoom >= autoZoomMax ? autoZoomMin : autoZoomMax;
        }
    }
</script>

<style>
.pdf-svelte {
    --c-border: var(--border-color, var(--theme-border-color));
    --c-background: var(--border-color, var(--theme-border-color));
    position: absolute;
    border: 2px solid var(--c-border);
    background: var(--c-background);
}

.viewer {
    position: relative;
    z-index: 1;
    overflow-y: auto;
    height: 100%;
    width: 100%;
}

.viewer canvas {
    display: block;
    margin: 0 auto;
    border: 1px solid var(--c-border);
}

.fit-both .viewer canvas {
    max-width: 100%;
    max-height: 100%;
}

.fit-horizontal .viewer canvas {
    width: 100%;
}

.fit-vertical .viewer canvas {
    height: 100%;
}

.display-paged .viewer canvas:not(.current-page) {
    display: none;
}

.controls {
    position: absolute;
    width: 100%;
    bottom: 0;
    text-align: center;
    z-index: 2;
    border-radius: 50%;
}

.display-all .controls {
    display: none;
}

.theme-dark {
    --theme-border-color: grey;
    --theme-background-color: darkgrey;
}

.theme-light {
    --theme-border-color: grey;
    --theme-background-color: lightgrey;
}
</style>

<div class="pdf-svelte theme-{opts.theme} display-{opts.display} fit-{opts.fit} {classes.overall?.join(" ") ?? ""}">
    {#if numPages}
        <slot>
            <div class="controls {classes.controls?.join(" ") ?? ""}">
                <button on:click={navigateLeft}>Previous</button>
                {pageNumberText?.(currentPage, numPages)}
                <button on:click={navigateRight}>Next</button>
            </div>
        </slot>
    {/if}
    <div bind:this={pageContainer} on:dblclick={autoZoom} aria-hidden="true" class="viewer {classes.container?.join(" ") ?? ""}">
        {#each Array.from({length: numPages}) as _, page}
            <canvas bind:this={pages[page]} class:current-page={page === currentPage - 1} />
        {/each}
    </div>
</div>
