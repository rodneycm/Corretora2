import CONFIG from "../core/config.js";

let imoveisCache = [];

/* =========================================================
CARREGAR IMÓVEIS
========================================================= */

export async function carregarImoveis() {

    try {

        /* =====================================================
        CACHE
        ===================================================== */

        if(imoveisCache.length > 0) {

            return imoveisCache;

        }

        /* =====================================================
        FETCH JSON
        ===================================================== */

        const response =
            await fetch(CONFIG.API_URL);

        if(!response.ok) {

            throw new Error(
                "Erro ao carregar imóveis"
            );

        }

        const data =
            await response.json();

        /* =====================================================
        VALIDAR JSON
        ===================================================== */

        if(
            !data.imoveis ||
            !Array.isArray(data.imoveis)
        ) {

            throw new Error(
                "Estrutura do JSON inválida"
            );

        }

        /* =====================================================
        SALVAR CACHE
        ===================================================== */

        imoveisCache =
            data.imoveis;

        return imoveisCache;

    } catch(error) {

        console.error(
            "Erro ao carregar imóveis:",
            error
        );

        return [];

    }

}

/* =========================================================
BUSCAR IMÓVEL POR SLUG
========================================================= */

export async function buscarImovelPorSlug(slug) {

    const imoveis =
        await carregarImoveis();

    return imoveis.find(
        imovel =>
            imovel.slug === slug
    );

}

/* =========================================================
OBTER DESTAQUES
========================================================= */

export async function obterDestaques() {

    const imoveis =
        await carregarImoveis();

    return imoveis.filter(
        imovel =>
            imovel.destaque === true
    );

}

/* =========================================================
FORMATAR PREÇO
========================================================= */

function formatarPreco(valor) {

    if(!valor) {

        return "Sob consulta";

    }

    return valor.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}

/* =========================================================
CRIAR CARD
========================================================= */

function criarCard(imovel) {

    /* =====================================================
    IMAGEM PRINCIPAL
    ===================================================== */

    const imagemPrincipal =

        imovel.midia?.thumbnail ||

        imovel.midia?.galeria?.[0] ||

        "assets/imoveis/placeholder.jpg";

    /* =====================================================
    PREÇO
    ===================================================== */

    const preco =
        formatarPreco(
            imovel.preco?.valor
        );

    /* =====================================================
    HTML
    ===================================================== */

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
                    📍 ${imovel.bairro || ""}
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

    if(!container) {

        return;

    }

    /* =====================================================
    CARREGAR IMÓVEIS
    ===================================================== */

    const imoveis =
        await carregarImoveis();

    /* =====================================================
    FILTRAR VENDA
    ===================================================== */

    const venda =
        imoveis.filter(

            item =>

                item.finalidade &&

                item.finalidade
                    .toLowerCase() === "venda"

        );

    /* =====================================================
    SEM RESULTADOS
    ===================================================== */

    if(venda.length === 0) {

        container.innerHTML = `

            <p class="sem-imoveis">

                Nenhum imóvel encontrado.

            </p>

        `;

        return;

    }

    /* =====================================================
    RENDERIZAR
    ===================================================== */

    container.innerHTML =

        venda
            .map(imovel => criarCard(imovel))
            .join("");

}