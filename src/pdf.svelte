<script>
    // import * as pdfjs from 'pdfjs-dist';
    import pdfjs from "@bundled-es-modules/pdfjs-dist/build/pdf";
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@2.2.228/build/pdf.worker.min.js";

    export let pdf;
    // checks "overall", "controls" and "container"
    export let classes = {};
    export let options = {};
    export let currentPage = 1;
    export let pageNumberText = (currentPage, maximumPages) => currentPage + "/" + maximumPages;

    const defaultOptions = {
        // paged, all
        display: "paged",
        // dark, light
        theme: 'dark',
        pdfjs: {}
    };

    $: opts = {...defaultOptions, ...options};

    let pageContainer = null;
    let doc = null;
    let numPages = 0;
    let pages = [];

    $: render(pdf);

    async function render(pdf) {
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

            let viewport = page.getViewport({ scale: 1, });
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

        dispatch("ready");
    }

    $: {
        if (!pageContainer || !pages) break $;
        pageContainer.innerHTML = "";
        if (opts.display == "paged") {
            let page = pages[currentPage - 1]
            pageContainer.append(page);
        } else {
            currentPage = 1;
            pages.forEach(page => pageContainer.append(page));
        }
    }

    function navigateLeft() {
        currentPage = Math.max(currentPage - 1, 1);
    }

    function navigateRight () {
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
</script>

<style>
.pdf-svelte {
    position: absolute;
}

canvas {
    display: block;
    margin: 0.4rem auto 0.6rem;
}

.theme-dark {
    border: 5px solid grey;
    background: darkgrey;
}

.theme-light {
    border: 5px solid grey;
    background: lightgrey;
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
</style>

<div class={generateClasses("pdf-svelte", "theme-" + opts.theme, "display-" + opts.display, classes.overall)}>
    <slot>
        <div class={generateClasses("controls", classes.controls)}>
            <button on:click={navigateLeft}>Previous</button>
            {getPageText(currentPage, numPages)}
            <button on:click={navigateRight}>Next</button>
        </div>
    </slot>
    <div bind:this={pageContainer} class={generateClasses("viewer", classes.container)}>
        <canvas></canvas>
    </div>
</div>
