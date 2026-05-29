
import {
    renderizarImoveisVenda
} from "../modules/imoveis.js";

/* =========================================================
APP START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await renderizarImoveisVenda();

    }
);