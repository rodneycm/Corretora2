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

        const resumoCaracteristicas = `

<div class="card-caracteristicas">

    ${imovel.caracteristicas?.quartos > 0
    ? `<span><i class="fa-solid fa-bed"></i> ${imovel.caracteristicas.quartos} Quartos</span>`
    : ""}

${imovel.caracteristicas?.banheiros > 0
    ? `<span><i class="fa-solid fa-bath"></i> ${imovel.caracteristicas.banheiros} Banheiros</span>`
    : ""}

${imovel.caracteristicas?.vagas > 0
    ? `<span><i class="fa-solid fa-car"></i> ${imovel.caracteristicas.vagas} Vagas</span>`
    : ""}

</div>

`;

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

        ${resumoCaracteristicas}

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

        <div class="imovel-localizacao">

            <i class="fa-solid fa-location-dot"></i>

            <span>
                ${imovel.bairro},
                ${imovel.cidade} - ${imovel.estado}
            </span>

        </div>

        ${caracteristicas}

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
            href="https://wa.me/${imovel.contato.whatsapp}?text=Olá,%20tenho%20interesse%20no%20imóvel%20${imovel.titulo}">

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

            item.finalidade ===
            imovel.finalidade &&

            item.cidade ===
            imovel.cidade

        )
        .slice(0,3);

    if(relacionados.length > 0){

        containerRelacionados.innerHTML = `

            <h2>
                Você também pode gostar
            </h2>

            <div class="relacionados-grid">

                ${relacionados.map(item => `

                    <article class="relacionado-card">

                        <img
                            src="${item.midia?.thumbnail || item.midia?.galeria?.[0]}"
                            alt="${item.titulo}">

                        <div class="relacionado-content">

                            <h3>
                                ${item.titulo}
                            </h3>

                            <div class="relacionado-local">

                                ${item.bairro},
                                ${item.cidade}

                            </div>

                            <div class="relacionado-preco">

                                ${formatarPreco(item.preco?.valor)}

                            </div>

                            <a
                                class="relacionado-btn"
                                href="imovel.html?slug=${item.slug}">

                                Ver imóvel

                            </a>

                        </div>

                    </article>

                `).join("")}

            </div>

        `;

    }

}
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