import {
    carregarImoveis
} from "./imoveis.js";

/* =========================================================
CRIAR CARD
========================================================= */

function criarCard(imovel) {

    return `

    <article class="card">

        <img
            src="${imovel.imagens[0]}"
            alt="${imovel.titulo}">

        <div class="card-content">

            <h3>
                ${imovel.titulo}
            </h3>

            <p>
                ${imovel.descricaoCurta}
            </p>

            <div class="card-infos">

                <span>
                    ${imovel.tipo}
                </span>

                <span>
                    ${imovel.bairro}
                </span>

                <span>
                    ${imovel.finalidade}
                </span>

            </div>

            <a
                href="${imovel.url}"
                class="card-btn">

                Ver imóvel

            </a>

        </div>

    </article>

    `;

}

/* =========================================================
RENDERIZAR IMÓVEIS
========================================================= */

export async function renderizarImoveis() {

    const container =
        document.getElementById(
            "imoveis-container"
        );

    if(!container) return;

    const imoveis =
        await carregarImoveis();

    const somenteVenda =
        imoveis.filter(
            item =>
            item.finalidade === "venda"
        );

    container.innerHTML =
        somenteVenda
        .map(criarCard)
        .join("");

}