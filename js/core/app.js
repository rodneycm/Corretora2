import {
    renderizarImoveisVenda,
    renderizarImoveisAluguel,
    renderizarPaginaImovel,
    renderizarDestaquesHome
}
from "../modules/imoveis.js";

import {
    inicializarScrollTop
}
from "../modules/scroll-top.js";

/* =========================================================
APP START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        /* =========================================
        HOME
        ========================================= */

        if (
            document.getElementById(
                "imoveis-destaque-home"
            )
        ) {

            await renderizarDestaquesHome();

        }

        /* =========================================
        PÁGINA COMPRAR
        ========================================= */

        if (
            document.getElementById(
                "lista-imoveis"
            )
        ) {

            await renderizarImoveisVenda();

        }

        /* =========================================
        PÁGINA ALUGAR
        ========================================= */

        if (
            document.getElementById(
                "lista-imoveis-aluguel"
            )
        ) {

            await renderizarImoveisAluguel();

        }

        /* =========================================
        PÁGINA DO IMÓVEL
        ========================================= */

        if (
            document.getElementById(
                "imovel-info"
            )
        ) {

            await renderizarPaginaImovel();

        }

        /* =========================================
        BOTÃO VOLTAR AO TOPO
        ========================================= */

        inicializarScrollTop();

    }
);