import CONFIG from "../core/config.js";

let imoveisCache = [];

/* =========================================================
UTILITÁRIOS
========================================================= */

function arraySeguro(valor) {

    return Array.isArray(valor)
        ? valor
        : [];

}

function textoSeguro(valor) {

    return typeof valor === "string"
        ? valor
        : "";

}

function numeroSeguro(valor) {

    return Number(valor) || 0;

}

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

        if(
            !data ||
            !Array.isArray(data.imoveis)
        ) {

            throw new Error(
                "Estrutura JSON inválida"
            );

        }

        imoveisCache =
            data.imoveis.filter(
                item =>
                    item &&
                    item.sistema?.publicado !== false
            );

        return imoveisCache;

    } catch(error) {

        console.error(
            "[IMOVEIS]",
            error
        );

        return [];

    }

}

/* =========================================================
BUSCAR IMÓVEL POR SLUG
========================================================= */

export async function buscarImovelPorSlug(slug) {

    if(!slug) {

        return null;

    }

    const imoveis =
        await carregarImoveis();

    return imoveis.find(

        imovel =>

            textoSeguro(
                imovel.slug
            ) === textoSeguro(slug)

    ) || null;

}

/* =========================================================
BUSCAR IMÓVEL POR ID
========================================================= */

export async function buscarImovelPorId(id) {

    if(!id) {

        return null;

    }

    const imoveis =
        await carregarImoveis();

    return imoveis.find(

        imovel =>

            textoSeguro(
                imovel.id
            ) === textoSeguro(id)

    ) || null;

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
OBTER IMÓVEIS POR FINALIDADE
========================================================= */

export async function obterPorFinalidade(finalidade) {

    const imoveis =
        await carregarImoveis();

    return imoveis.filter(

        item =>

            textoSeguro(
                item.finalidade
            ).toLowerCase()

            ===

            textoSeguro(
                finalidade
            ).toLowerCase()

    );

}

/* =========================================================
FORMATAR PREÇO
========================================================= */

function formatarPreco(valor) {

    const preco =
        Number(valor) || 0;

    return preco.toLocaleString(

        "pt-BR",

        {
            style: "currency",
            currency: "BRL"
        }

    );

}

/* =========================================================
FORMATAR URL SEO
========================================================= */

function urlImovel(slug) {

    return `imovel.html?slug=${encodeURIComponent(slug)}`;

}

/* =========================================================
CRIAR CARD
========================================================= */

function criarCard(imovel) {

    const imagemPrincipal =

        textoSeguro(
            imovel?.midia?.thumbnail
        )

        ||

        textoSeguro(
            imovel?.midia?.galeria?.[0]
        )

        ||

        CONFIG.IMAGE_FALLBACK;

    const preco =

        formatarPreco(
            imovel?.preco?.valor
        );

    const titulo =

        textoSeguro(
            imovel?.titulo
        );

    const resumo =

        textoSeguro(
            imovel?.descricao?.resumo
        );

    const bairro =

        textoSeguro(
            imovel?.bairro
        );

    const finalidade =

        textoSeguro(
            imovel?.finalidade
        );

    const status =

        textoSeguro(
            imovel?.status
        );

    const quartos =
        numeroSeguro(
            imovel?.caracteristicas?.quartos
        );

    const banheiros =
        numeroSeguro(
            imovel?.caracteristicas?.banheiros
        );

    const vagas =
        numeroSeguro(
            imovel?.caracteristicas?.vagas
        );

    /* =====================================================
    BADGES
    ===================================================== */

    let badgeStatus = "";

    if(
        status.toLowerCase() === "vendido"
    ) {

        badgeStatus =

        `<span class="badge-status badge-vendido">
            Vendido
        </span>`;

    }

    if(
        status.toLowerCase() === "alugado"
    ) {

        badgeStatus =

        `<span class="badge-status badge-alugado">
            Alugado
        </span>`;

    }

    const badgeFinalidade =

        finalidade

        ?

        `<span class="badge-finalidade">
            ${finalidade}
        </span>`

        :

        "";

    /* =====================================================
    CARACTERÍSTICAS
    ===================================================== */

    const resumoCaracteristicas = `

    <div class="card-caracteristicas">

        ${quartos > 0
        ? `
        <span>
            <i class="fa-solid fa-bed"></i>
            ${quartos} Quartos
        </span>
        `
        : ""}

        ${banheiros > 0
        ? `
        <span>
            <i class="fa-solid fa-bath"></i>
            ${banheiros} Banheiros
        </span>
        `
        : ""}

        ${vagas > 0
        ? `
        <span>
            <i class="fa-solid fa-car"></i>
            ${vagas} Vagas
        </span>
        `
        : ""}

    </div>

    `;

    /* =====================================================
    HTML
    ===================================================== */

    return `

    <article class="imovel-card">

        <div class="imovel-image">

            ${badgeFinalidade}

            ${badgeStatus}

            <img
                loading="lazy"
                src="${imagemPrincipal}"
                alt="${titulo}">

        </div>

        <div class="imovel-content">

            <h3>
                ${titulo}
            </h3>

            <p>
                ${resumo}
            </p>

            ${resumoCaracteristicas}

            <div class="imovel-info">

                <span>
                    📍 ${bairro}
                </span>

                <span>
                    💰 ${preco}
                </span>

            </div>

            <a
                class="imovel-btn"
                href="${urlImovel(imovel.slug)}">

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

const galeriaImagens =
    imovel.midia?.galeria || [];

const fotoPrincipal =
    galeriaImagens[0] ||
    "assets/imoveis/placeholder.jpg";

const miniaturas =
    galeriaImagens
    .map(
        (imagem, index) => `

        <img
            class="thumb-imovel ${index === 0 ? "thumb-ativa" : ""}"
            data-index="${index}"
            src="${imagem}"
            alt="${imovel.titulo}">

        `
    )
    .join("");

galeria.innerHTML = `

    <div class="foto-principal">

        <button
            class="btn-galeria btn-anterior"
            id="btn-anterior">

            <i class="fa-solid fa-chevron-left"></i>

        </button>

        <img
            id="imagem-principal"
            src="${fotoPrincipal}"
            alt="${imovel.titulo}">

        <button
            class="btn-galeria btn-proximo"
            id="btn-proximo">

            <i class="fa-solid fa-chevron-right"></i>

        </button>

    </div>

    <div class="miniaturas-imovel">

        ${miniaturas}

    </div>

`;

let indiceAtual = 0;

const imagemPrincipal =
    document.getElementById(
        "imagem-principal"
    );

const miniaturasDOM =
    document.querySelectorAll(
        ".thumb-imovel"
    );

function atualizarGaleria(index) {

    indiceAtual = index;

    imagemPrincipal.src =
        galeriaImagens[index];

    miniaturasDOM.forEach(
        thumb =>
            thumb.classList.remove(
                "thumb-ativa"
            )
    );

    miniaturasDOM[index]
        ?.classList.add(
            "thumb-ativa"
        );

}

miniaturasDOM.forEach(
    thumb => {

        thumb.addEventListener(
            "click",
            () => {

                atualizarGaleria(
                    Number(
                        thumb.dataset.index
                    )
                );

            }
        );

    }
);

document
.getElementById(
    "btn-anterior"
)
?.addEventListener(
    "click",
    () => {

        indiceAtual--;

        if(indiceAtual < 0) {

            indiceAtual =
                galeriaImagens.length - 1;

        }

        atualizarGaleria(
            indiceAtual
        );

    }
);

document
.getElementById(
    "btn-proximo"
)
?.addEventListener(
    "click",
    () => {

        indiceAtual++;

        if(
            indiceAtual >=
            galeriaImagens.length
        ) {

            indiceAtual = 0;

        }

        atualizarGaleria(
            indiceAtual
        );

    }
);

document.addEventListener(
    "keydown",
    event => {

        if(
            event.key ===
            "ArrowLeft"
        ) {

            document
            .getElementById(
                "btn-anterior"
            )
            ?.click();

        }

        if(
            event.key ===
            "ArrowRight"
        ) {

            document
            .getElementById(
                "btn-proximo"
            )
            ?.click();

        }

    }
);

/* =====================================================
LIGHTBOX
===================================================== */

imagemPrincipal.style.cursor = "zoom-in";

imagemPrincipal.addEventListener(
    "click",
    () => {

        const lightbox =
            document.createElement("div");

        lightbox.className =
            "lightbox-imovel";

        lightbox.innerHTML = `

            <button
                class="lightbox-fechar">

                <i class="fa-solid fa-xmark"></i>

            </button>

            <button
                class="lightbox-nav lightbox-anterior">

                <i class="fa-solid fa-chevron-left"></i>

            </button>

            <img
                class="lightbox-img"
                src="${galeriaImagens[indiceAtual]}">

            <button
                class="lightbox-nav lightbox-proximo">

                <i class="fa-solid fa-chevron-right"></i>

            </button>

        `;

        document.body.appendChild(
            lightbox
        );

        const imagemLightbox =
            lightbox.querySelector(
                ".lightbox-img"
            );

        function atualizarLightbox() {

            imagemLightbox.src =
                galeriaImagens[indiceAtual];

        }

        lightbox
        .querySelector(
            ".lightbox-anterior"
        )
        .addEventListener(
            "click",
            () => {

                indiceAtual--;

                if(indiceAtual < 0) {

                    indiceAtual =
                        galeriaImagens.length - 1;

                }

                atualizarLightbox();

            }
        );

        lightbox
        .querySelector(
            ".lightbox-proximo"
        )
        .addEventListener(
            "click",
            () => {

                indiceAtual++;

                if(
                    indiceAtual >=
                    galeriaImagens.length
                ) {

                    indiceAtual = 0;

                }

                atualizarLightbox();

            }
        );

        function fecharLightbox() {

            lightbox.remove();

            document.removeEventListener(
                "keydown",
                tecladoLightbox
            );

        }

        lightbox
        .querySelector(
            ".lightbox-fechar"
        )
        .addEventListener(
            "click",
            fecharLightbox
        );

        lightbox.addEventListener(
            "click",
            event => {

                if(
                    event.target ===
                    lightbox
                ) {

                    fecharLightbox();

                }

            }
        );

        function tecladoLightbox(event) {

            if(
                event.key === "Escape"
            ) {

                fecharLightbox();

            }

            if(
                event.key === "ArrowLeft"
            ) {

                lightbox
                .querySelector(
                    ".lightbox-anterior"
                )
                .click();

            }

            if(
                event.key === "ArrowRight"
            ) {

                lightbox
                .querySelector(
                    ".lightbox-proximo"
                )
                .click();

            }

        }

        document.addEventListener(
            "keydown",
            tecladoLightbox
        );

    }
);

    /* =====================================================
PREÇO E DADOS PRINCIPAIS
===================================================== */

const preco =
    formatarPreco(
        imovel.preco?.valor
    );

const bairro =
    imovel.localizacao?.bairro ||
    imovel.bairro ||
    "";

const cidade =
    imovel.localizacao?.cidade ||
    imovel.cidade ||
    "";

const estado =
    imovel.localizacao?.estado ||
    imovel.estado ||
    "";

const whatsapp =
    imovel.contato?.whatsapp ||
    CONFIG.WHATSAPP;

const urlAtual =
    window.location.href;

const titulo =
    imovel.titulo || "";

const descricaoResumo =
    imovel.descricao?.resumo ||
    "";

const imagemCompartilhamento =

    `${CONFIG.SITE_URL}/${
        (
            imovel.midia?.thumbnail ||
            imovel.midia?.galeria?.[0] ||
            CONFIG.IMAGE_FALLBACK
        ).replace(/^\.?\//, "")
    }`;

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

        const caracteristicas = `

<div class="imovel-caracteristicas">

    ${imovel.caracteristicas?.quartos > 0 ? `
    <div class="caracteristica-item">
        <i class="fa-solid fa-bed"></i>
        ${imovel.caracteristicas.quartos} Quartos
    </div>
    ` : ""}

    ${imovel.caracteristicas?.banheiros > 0 ? `
    <div class="caracteristica-item">
        <i class="fa-solid fa-bath"></i>
        ${imovel.caracteristicas.banheiros} Banheiros
    </div>
    ` : ""}

    ${imovel.caracteristicas?.vagas > 0 ? `
    <div class="caracteristica-item">
        <i class="fa-solid fa-car"></i>
        ${imovel.caracteristicas.vagas} Vagas
    </div>
    ` : ""}

    ${imovel.caracteristicas?.suites > 0 ? `
    <div class="caracteristica-item">
        <i class="fa-solid fa-star"></i>
        ${imovel.caracteristicas.suites} Suíte(s)
    </div>
    ` : ""}

    ${imovel.metragem?.areaConstruida > 0 ? `
    <div class="caracteristica-item">
        <i class="fa-solid fa-ruler-combined"></i>
        ${imovel.metragem.areaConstruida} m² Construídos
    </div>
    ` : ""}

    ${imovel.metragem?.areaTerreno > 0 ? `
    <div class="caracteristica-item">
        <i class="fa-solid fa-tree"></i>
        ${imovel.metragem.areaTerreno} m² Terreno
    </div>
    ` : ""}

</div>

`;

/* =====================================================
BREADCRUMB
===================================================== */

const breadcrumb =
    document.getElementById(
        "breadcrumb"
    );

if(breadcrumb){

    breadcrumb.innerHTML = `

        <a href="index.html">
            Início
        </a>

        <span>/</span>

        <a href="comprar.html">
            ${imovel.finalidade}
        </a>

        <span>/</span>

        <span>
            ${imovel.titulo}
        </span>

    `;

}
       /* =====================================================
    INFO
    ===================================================== */
info.innerHTML = `

    <span class="imovel-tag">

        ${imovel.finalidade || ""}

    </span>

    <h1>

        ${titulo}

    </h1>

    <h2>

        ${preco}

    </h2>

    <div class="imovel-localizacao">

    <i class="fa-solid fa-location-dot"></i>

    <span>

        ${bairro},
        ${cidade} - ${estado}

    </span>

</div>

<div class="imovel-meta">

    <div class="imovel-codigo">

        <strong>Código:</strong>

        ${imovel.codigo || "N/D"}

    </div>

    <div class="imovel-status">

        <span class="
            status-badge
            status-${(imovel.status || '').toLowerCase()}
        ">

            ${(imovel.status || "Disponivel")
                .replace("Disponivel","Disponível")}

        </span>

    </div>

</div>

${caracteristicas}

    <p>

        ${imovel.subtitulo || ""}

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

    <div class="imovel-compartilhar">

        <h3>

            Compartilhar imóvel

        </h3>

        <div class="compartilhar-botoes">

            <button
                id="compartilhar-whatsapp"
                class="btn-compartilhar">

                <i class="fab fa-whatsapp"></i>

                WhatsApp

            </button>

            <button
                id="compartilhar-facebook"
                class="btn-compartilhar">

                <i class="fab fa-facebook-f"></i>

                Facebook

            </button>

            <button
                id="copiar-link"
                class="btn-compartilhar">

                <i class="fa-solid fa-link"></i>

                Copiar Link

            </button>

        </div>

    </div>

    <a
        class="imovel-whatsapp"
        target="_blank"
        href="https://wa.me/${whatsapp}?text=${encodeURIComponent(
            `Olá, tenho interesse no imóvel ${titulo}`
        )}">

        <i class="fab fa-whatsapp"></i>

        Falar sobre este imóvel

    </a>

`;

/* =====================================================
IMÓVEIS RELACIONADOS
===================================================== */

const containerRelacionados =
    document.getElementById(
        "imoveis-relacionados"
    );

if(containerRelacionados){

    const todosImoveis =
        await carregarImoveis();

    const relacionados =
        todosImoveis

        .filter(item =>

            item.slug !== imovel.slug &&

            (
                item.finalidade ===
                imovel.finalidade
            )

        )

        .slice(0, 3);

    if(relacionados.length > 0){

        containerRelacionados.innerHTML = `

            <h2 class="titulo-relacionados">

                Você também pode gostar

            </h2>

            <div class="relacionados-grid">

                ${relacionados.map(item => {

                    const imagem =

                        item.midia?.thumbnail ||

                        item.midia?.galeria?.[0] ||

                        CONFIG.IMAGE_FALLBACK;

                    const precoRelacionado =

                        formatarPreco(
                            item.preco?.valor
                        );

                    const bairroRelacionado =

                        item.localizacao?.bairro ||

                        item.bairro ||

                        "";

                    const cidadeRelacionada =

                        item.localizacao?.cidade ||

                        item.cidade ||

                        "";

                    return `

                        <article
                            class="relacionado-card">

                            <img
                                src="${imagem}"
                                alt="${item.titulo}">

                            <div
                                class="relacionado-content">

                                <h3>

                                    ${item.titulo}

                                </h3>

                                <div
                                    class="relacionado-local">

                                    ${bairroRelacionado}
                                    ${cidadeRelacionada ? ` - ${cidadeRelacionada}` : ""}

                                </div>

                                <div
                                    class="relacionado-preco">

                                    ${precoRelacionado}

                                </div>

                                <a
                                    class="relacionado-btn"
                                    href="${urlImovel(item.slug)}">

                                    Ver imóvel

                                </a>

                            </div>

                        </article>

                    `;

                }).join("")}

            </div>

        `;

    }

}

/* =====================================================
SEO DINÂMICO
===================================================== */

document.title =

    imovel.seo?.title ||

    `${titulo} | ${CONFIG.SITE_NAME}`;

/* =====================================================
META DESCRIPTION
===================================================== */

const metaDescription =

    document.querySelector(
        'meta[name="description"]'
    );

if(metaDescription){

    metaDescription.setAttribute(

        "content",

        imovel.seo?.description ||

        descricaoResumo

    );

}

/* =====================================================
OPEN GRAPH TITLE
===================================================== */

let ogTitle =

    document.querySelector(
        'meta[property="og:title"]'
    );

if(ogTitle){

    ogTitle.setAttribute(

        "content",

        imovel.seo?.title ||

        titulo

    );

}

/* =====================================================
OPEN GRAPH DESCRIPTION
===================================================== */

let ogDescription =

    document.querySelector(
        'meta[property="og:description"]'
    );

if(ogDescription){

    ogDescription.setAttribute(

        "content",

        imovel.seo?.description ||

        descricaoResumo

    );

}

/* =====================================================
OPEN GRAPH IMAGE
===================================================== */

let ogImage =

    document.querySelector(
        'meta[property="og:image"]'
    );

if(ogImage){

    ogImage.setAttribute(

        "content",

        imagemCompartilhamento

    );

}

/* =====================================================
OPEN GRAPH URL
===================================================== */

let ogUrl =

    document.querySelector(
        'meta[property="og:url"]'
    );

if(ogUrl){

    ogUrl.setAttribute(

        "content",

        urlAtual

    );

}

/* =====================================================
COMPARTILHAMENTO WHATSAPP
===================================================== */

document
.getElementById(
    "compartilhar-whatsapp"
)
?.addEventListener(
    "click",
    () => {

        const mensagem =

            `${titulo}\n\n${urlAtual}`;

        window.open(

            `https://wa.me/?text=${encodeURIComponent(mensagem)}`,

            "_blank"

        );

    }
);

/* =====================================================
COMPARTILHAMENTO FACEBOOK
===================================================== */

document
.getElementById(
    "compartilhar-facebook"
)
?.addEventListener(
    "click",
    () => {

        window.open(

            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlAtual)}`,

            "_blank"

        );

    }
);

/* =====================================================
COPIAR LINK
===================================================== */

document
.getElementById(
    "copiar-link"
)
?.addEventListener(
    "click",

    async () => {

        try {

            await navigator.clipboard.writeText(
                urlAtual
            );

            alert(
                "Link copiado com sucesso!"
            );

        } catch(error){

            console.error(error);

        }

    }

);

}