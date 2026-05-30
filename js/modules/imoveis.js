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
                href="imovel.html?slug=${imovel.slug}">

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

/* =========================================================
RENDERIZAR PÁGINA DO IMÓVEL
========================================================= */

export async function renderizarPaginaImovel() {

    /* =====================================================
    PEGAR SLUG DA URL
    ===================================================== */

    const params =
        new URLSearchParams(
            window.location.search
        );

    const slug =
        params.get("slug");

    if(!slug) return;

    /* =====================================================
    BUSCAR IMÓVEL
    ===================================================== */

    const imovel =
        await buscarImovelPorSlug(slug);

    if(!imovel) {

        console.error(
            "Imóvel não encontrado"
        );

        return;

    }

    /* =====================================================
    ELEMENTOS
    ===================================================== */

    const galeria =
        document.getElementById(
            "imovel-galeria"
        );

    const info =
        document.getElementById(
            "imovel-info"
        );

    if(!galeria || !info) return;

    /* =====================================================
    GALERIA
    ===================================================== */

    const fotoPrincipal =
    imovel.midia.galeria[0];

const miniaturas =
    imovel.midia.galeria
    .map(
        imagem => `

        <img
            class="thumb-imovel"
            src="${imagem}"
            alt="${imovel.titulo}">

    `
    )
    .join("");

galeria.innerHTML = `

    <div class="foto-principal">

        <img
            id="imagem-principal"
            src="${fotoPrincipal}"
            alt="${imovel.titulo}">

    </div>

    <div class="miniaturas-imovel">

        ${miniaturas}
        
    </div>
    

`;
renderizarPaginaImovel()

const imagemPrincipal =
    document.getElementById(
        "imagem-principal"
    );

document
.querySelectorAll(".thumb-imovel")
.forEach(thumb => {

    thumb.addEventListener(
        "click",
        () => {

            imagemPrincipal.src =
                thumb.src;

        }
    );

});
    /* =====================================================
    PREÇO
    ===================================================== */

    const preco =
        formatarPreco(
            imovel.preco.valor
        );

    /* =====================================================
    DIFERENCIAIS
    ===================================================== */

    const diferenciais =
        imovel.diferenciais
        .map(
            item => `

            <li>${item}</li>

        `
        )
        .join("");

    /* =====================================================
    DESCRIÇÃO
    ===================================================== */

    const descricao =
        imovel.descricao.completa
        .map(
            texto => `

            <p>${texto}</p>

        `
        )
        .join("");

    /* =====================================================
    INFO
    ===================================================== */

    info.innerHTML = `

        <span class="imovel-tag">

            ${imovel.finalidade}

        </span>

        <h1>

            ${imovel.titulo}

        </h1>

        <h2>

            ${preco}

        </h2>

        <p>

            ${imovel.subtitulo}

        </p>

        <div class="descricao-imovel">

            ${descricao}

        </div>

        <h3>

            Diferenciais

        </h3>

        <ul class="imovel-diferenciais">

            ${diferenciais}

        </ul>

        <a
            class="imovel-whatsapp"
            target="_blank"
            href="https://wa.me/${imovel.contato.whatsapp}?text=Olá,%20tenho%20interesse%20no%20imóvel%20${imovel.titulo}">

            <i class="fab fa-whatsapp"></i>

            Falar sobre este imóvel

        </a>

    `;

    /* =====================================================
    SEO DINÂMICO
    ===================================================== */

    document.title =
        imovel.seo.title;

    const metaDescription =
        document.querySelector(
            'meta[name="description"]'
        );

    if(metaDescription) {

        metaDescription.setAttribute(
            "content",
            imovel.seo.description
        );

    }

}