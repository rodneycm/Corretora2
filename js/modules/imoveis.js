
import CONFIG from "../core/config.js";

let imoveisCache = [];

/* =========================================================
CARREGAR IMÓVEIS
========================================================= */

export async function carregarImoveis() {

    try {

        if(imoveisCache.length > 0) {

            return imoveisCache;

        }

        const response =
            await fetch(CONFIG.API_URL);

        if(!response.ok) {

            throw new Error(
                "Erro ao carregar imóveis"
            );

        }
        
const data =
    await response.json();

console.log(data);

imoveisCache = data.imoveis;

console.log(imoveisCache);

        return data;

    } catch(error) {

        console.error(error);

        return [];

    }

}

/* =========================================================
BUSCAR POR SLUG
========================================================= */

export async function buscarImovelPorSlug(slug) {

    const imoveis =
        await carregarImoveis();

    return imoveis.find(
        imovel => imovel.slug === slug
    );

}

/* =========================================================
DESTAQUES
========================================================= */

export async function obterDestaques() {

    const imoveis =
        await carregarImoveis();

    return imoveis.filter(
        imovel => imovel.destaque === true
    );

}

/* =========================================================
CRIAR CARD HTML
========================================================= */

function criarCard(imovel) {

    return `

    <article class="imovel-card">

        <div class="imovel-image">

            <img
                src="${imovel.imagens[0]}"
                alt="${imovel.titulo}">

        </div>

        <div class="imovel-content">

            <h3>
                ${imovel.titulo}
            </h3>

            <p>

                ${imovel.descricaoCurta}

            </p>

            <div class="imovel-info">

                <span>
                    📍 ${imovel.bairro}
                </span>

                <span>
                    💰 ${imovel.precoFormatado}
                </span>

            </div>

            <a
                class="imovel-btn"
                href="${imovel.url}">

                Ver imóvel

            </a>

        </div>

    </article>

    `;

}

/* =========================================================
RENDERIZAR IMÓVEIS
========================================================= */

export async function renderizarImoveisVenda() {

    const container =
        document.getElementById(
            "lista-imoveis"
        );

    if(!container) return;

    const imoveis =
        await carregarImoveis();

    const venda =
        imoveis.filter(
            item =>
            item.finalidade === "venda"
        );

    container.innerHTML =
        venda
        .map(criarCard)
        .join("");

}