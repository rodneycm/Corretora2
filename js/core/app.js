import {
    renderizarImoveisVenda,
    renderizarImoveisAluguel,
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

        if(
            document.getElementById(
              "lista-imoveis-aluguel"
             )
        ) {

    await renderizarImoveisAluguel();

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