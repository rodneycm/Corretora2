import {
    renderizarImoveisVenda,
    renderizarPaginaImovel
}
from "../modules/imoveis.js";

/* =========================================================
APP START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        /* =========================================
        LISTAGEM DE IMÓVEIS
        ========================================= */

        if(
            document.getElementById(
                "lista-imoveis"
            )
        ) {

            await renderizarImoveisVenda();

        }

        /* =========================================
        PÁGINA DO IMÓVEL
        ========================================= */

        if(
            document.getElementById(
                "imovel-info"
            )
        ) {

            await renderizarPaginaImovel();

        }

    }
);