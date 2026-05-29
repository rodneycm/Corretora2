import {
    renderizarImoveis
} from "../modules/renderImoveis.js";

/* =========================================================
APP START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await renderizarImoveis();

    }
);