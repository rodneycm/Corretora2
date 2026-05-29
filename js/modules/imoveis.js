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

        /* =====================================================
        VALIDAR ESTRUTURA
        ===================================================== */

        if(
            !data.imoveis ||
            !Array.isArray(data.imoveis)
        ) {

            throw new Error(
                "Estrutura do JSON inválida"
            );

        }

        imoveisCache =
            data.imoveis;

        console.log(imoveisCache);

        return imoveisCache;

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
FORMATAR PREÇO
========================================================= */

function formatarPreco(valor) {

    return valor.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}

/* =========================================================
CRIAR CARD HTML
========================================================= */

function criarCard(imovel) {

    const imagemPrincipal =
        imovel.midia?.thumbnail ||
        "assets/imoveis/placeholder.jpg";

    const preco =
        formatarPreco(
            imovel.preco?.valor || 0
        );

    return `

    <article class="imovel-card">

        <div class="imovel-image">

            <img
                src="${imagemPrincipal}"
                alt="${imovel.titulo}">

        </div>

        <div class="imovel-content">

            <h3>
                ${imovel.titulo}
            </h3>

            <p>

                ${imovel.descricao?.resumo || ""}

            </p>

            <div class="imovel-info">

                <span>
                    📍 ${imovel.bairro}
                </span>

                <span>
                    💰 ${preco}
                </span>

            </div>

            <a
                class="imovel-btn"
                href="imoveis/venda/${imovel.id}.html">

                Ver imóvel

            </a>

        </div>

    </article>

`;

}

/* =========================================================
RENDERIZAR IMÓVEIS VENDA
========================================================= */

export async function renderizarImoveisVenda() {

    const container =
        document.getElementById(
            "lista-imoveis"
        );

    if(!container) return;

    const imoveis =
        await carregarImoveis();

    console.log(
        "TIPO:",
        typeof imoveis
    );

    console.log(
        "ARRAY?",
        Array.isArray(imoveis)
    );

    console.log(
        imoveis
    );

    const venda =
        imoveis.filter(
            item =>

            item.finalidade &&
            item.finalidade.toLowerCase() === "venda"

        );

    container.innerHTML =
        venda
        .map(criarCard)
        .join("");

}