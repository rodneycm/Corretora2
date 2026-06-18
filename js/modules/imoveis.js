import CONFIG from "../core/config.js";
import { inicializarGaleria } from "./galeria.js";

import {
    criarCard,
    formatarPreco,
    urlImovel
} from "./cards.js";

import {
    filtrarPorBairro,
    filtrarPorQuartos,
    filtrarPorPreco,
    ordenarImoveis
} from "./filtros.js";

let imoveisCache = [];

/* =========================================================
   UTILITÁRIOS
========================================================= */

function arraySeguro(valor) {
    return Array.isArray(valor) ? valor : [];
}

function textoSeguro(valor) {
    return typeof valor === "string" ? valor : "";
}

function numeroSeguro(valor) {
    return Number(valor) || 0;
}

function urlCanonicaImovel(slug) {
    return `${CONFIG.SITE_URL}/${urlImovel(slug)}`;
}

function imagemAbsoluta(caminho) {
    const imagem = textoSeguro(caminho) || CONFIG.IMAGE_FALLBACK;

    return `${CONFIG.SITE_URL}/${imagem.replace(/^\.?\//, "")}`;
}

function upsertMeta(seletor, atributo, valorAtributo, content) {
    let meta = document.querySelector(seletor);

    if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(atributo, valorAtributo);
        document.head.appendChild(meta);
    }

    meta.setAttribute("content", content);
}

function mostrarToastCompartilhamento(mensagem) {
    const toastExistente =
        document.querySelector(".compartilhar-toast");

    if (toastExistente) {
        toastExistente.remove();
    }

    const toast = document.createElement("div");
    toast.className = "compartilhar-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.textContent = mensagem;

    document.body.appendChild(toast);

    window.setTimeout(() => {
        toast.classList.add("compartilhar-toast-visivel");
    }, 10);

    window.setTimeout(() => {
        toast.classList.remove("compartilhar-toast-visivel");

        window.setTimeout(() => {
            toast.remove();
        }, 250);
    }, 2000);
}

/* =========================================================
   CARREGAR IMÓVEIS
========================================================= */

export async function carregarImoveis() {

    try {

        if (imoveisCache.length > 0) {
            return imoveisCache;
        }

        const response = await fetch(CONFIG.API_URL);

        if (!response.ok) {
            throw new Error("Erro ao carregar imóveis");
        }

        const data = await response.json();

        if (!data || !Array.isArray(data.imoveis)) {
            throw new Error("Estrutura JSON inválida");
        }

        imoveisCache = data.imoveis.filter(
            item => item && item.sistema?.publicado !== false
        );

        return imoveisCache;

    } catch (error) {

        console.error("[IMOVEIS]", error);
        return [];

    }
}

/* =========================================================
   BUSCAR IMÓVEL POR SLUG
========================================================= */

export async function buscarImovelPorSlug(slug) {

    if (!slug) return null;

    const imoveis = await carregarImoveis();

    return imoveis.find(
        imovel => textoSeguro(imovel.slug) === textoSeguro(slug)
    ) || null;
}

/* =========================================================
   BUSCAR IMÓVEL POR ID
========================================================= */

export async function buscarImovelPorId(id) {

    if (!id) return null;

    const imoveis = await carregarImoveis();

    return imoveis.find(
        imovel => textoSeguro(imovel.id) === textoSeguro(id)
    ) || null;
}

/* =========================================================
   OBTER DESTAQUES
========================================================= */

export async function obterDestaques() {

    const imoveis = await carregarImoveis();

    return imoveis.filter(imovel => imovel.destaque === true);
}

/* =========================================================
   RENDERIZAR DESTAQUES HOME
========================================================= */

export async function renderizarDestaquesHome() {

    const container = document.getElementById("imoveis-destaque-home");

    if (!container) return;

    const destaques = await obterDestaques();

    if (destaques.length === 0) {
        container.innerHTML = `<p class="sem-imoveis">Nenhum imóvel em destaque.</p>`;
        return;
    }

    container.innerHTML = destaques
        .slice(0, 6)
        .map(imovel => criarCard(imovel))
        .join("");
}

/* =========================================================
   OBTER IMÓVEIS POR FINALIDADE
========================================================= */

export async function obterPorFinalidade(finalidade) {

    const imoveis = await carregarImoveis();

    return imoveis.filter(
        item =>
            textoSeguro(item.finalidade).toLowerCase() ===
            textoSeguro(finalidade).toLowerCase()
    );
}

/* =========================================================
   RENDERIZAR IMÓVEIS VENDA
========================================================= */

export async function renderizarImoveisVenda() {

    const container = document.getElementById("lista-imoveis");

    if (!container) return;

    const todosImoveis = await carregarImoveis();

    const venda = todosImoveis.filter(
        item => item.finalidade?.toLowerCase() === "venda"
    );

    /* -------------------------------------------------
       POPULAR FILTRO DE BAIRROS
    ------------------------------------------------- */

    const filtroBairro = document.getElementById("filtro-bairro");

    if (filtroBairro) {

        const bairros = [
            ...new Set(venda.map(item => item.bairro).filter(Boolean))
        ].sort();

        filtroBairro.innerHTML = `<option value="">Todos os bairros</option>`;

        bairros.forEach(bairro => {
            filtroBairro.innerHTML += `<option value="${bairro}">${bairro}</option>`;
        });
    }

    /* -------------------------------------------------
       ATUALIZAR LISTA
    ------------------------------------------------- */

    function atualizarLista() {

        let resultado = [...venda];

        const bairro    = document.getElementById("filtro-bairro")?.value  || "";
        const quartos   = document.getElementById("filtro-quartos")?.value || "";
        const preco     = document.getElementById("filtro-preco")?.value   || "";
        const ordenacao = document.getElementById("ordenacao")?.value      || "";

        resultado = filtrarPorBairro(resultado, bairro);
        resultado = filtrarPorQuartos(resultado, quartos);
        resultado = filtrarPorPreco(resultado, preco);
        resultado = ordenarImoveis(resultado, ordenacao);

        if (resultado.length === 0) {
            container.innerHTML = `<p class="sem-imoveis">Nenhum imóvel encontrado.</p>`;
            return;
        }

        container.innerHTML = resultado.map(imovel => criarCard(imovel)).join("");
    }

    atualizarLista();

    document.getElementById("filtro-bairro")?.addEventListener("change", atualizarLista);
    document.getElementById("filtro-quartos")?.addEventListener("change", atualizarLista);
    document.getElementById("filtro-preco")?.addEventListener("change", atualizarLista);
    document.getElementById("ordenacao")?.addEventListener("change", atualizarLista);

    document.getElementById("limpar-filtros")?.addEventListener("click", () => {
        document.getElementById("filtro-bairro").value = "";
        document.getElementById("filtro-quartos").value = "";
        document.getElementById("filtro-preco").value = "";
        document.getElementById("ordenacao").value = "";

        atualizarLista();
    });
}

/* =========================================================
   RENDERIZAR IMÓVEIS ALUGUEL
========================================================= */

export async function renderizarImoveisAluguel() {

    const container = document.getElementById("lista-imoveis-aluguel");

    if (!container) return;

    const todosImoveis = await carregarImoveis();

    const aluguel = todosImoveis.filter(
        item => item.finalidade?.toLowerCase() === "aluguel"
    );

    /* -------------------------------------------------
       POPULAR FILTRO DE BAIRROS
    ------------------------------------------------- */

    const filtroBairro = document.getElementById("filtro-bairro");

    if (filtroBairro) {

        const bairros = [
            ...new Set(aluguel.map(item => item.bairro).filter(Boolean))
        ].sort();

        filtroBairro.innerHTML = `<option value="">Todos os bairros</option>`;

        bairros.forEach(bairro => {
            filtroBairro.innerHTML += `<option value="${bairro}">${bairro}</option>`;
        });
    }

    /* -------------------------------------------------
       ATUALIZAR LISTA
    ------------------------------------------------- */

    function atualizarLista() {

        let resultado = [...aluguel];

        const bairro    = document.getElementById("filtro-bairro")?.value  || "";
        const quartos   = document.getElementById("filtro-quartos")?.value || "";
        const preco     = document.getElementById("filtro-preco")?.value   || "";
        const ordenacao = document.getElementById("ordenacao")?.value      || "";

        resultado = filtrarPorBairro(resultado, bairro);
        resultado = filtrarPorQuartos(resultado, quartos);
        resultado = filtrarPorPreco(resultado, preco);
        resultado = ordenarImoveis(resultado, ordenacao);

        if (resultado.length === 0) {
            container.innerHTML = `<p class="sem-imoveis">Nenhum imóvel encontrado.</p>`;
            return;
        }

        container.innerHTML = resultado.map(imovel => criarCard(imovel)).join("");
    }

    atualizarLista();

    document.getElementById("filtro-bairro")?.addEventListener("change", atualizarLista);
    document.getElementById("filtro-quartos")?.addEventListener("change", atualizarLista);
    document.getElementById("filtro-preco")?.addEventListener("change", atualizarLista);
    document.getElementById("ordenacao")?.addEventListener("change", atualizarLista);

    document.getElementById("limpar-filtros")?.addEventListener("click", () => {
        document.getElementById("filtro-bairro").value = "";
        document.getElementById("filtro-quartos").value = "";
        document.getElementById("filtro-preco").value = "";
        document.getElementById("ordenacao").value = "";

        atualizarLista();
    });

} // ← CHAVE QUE ESTAVA FALTANDO — fecha renderizarImoveisAluguel

/* =========================================================
   RENDERIZAR PÁGINA DO IMÓVEL
========================================================= */

export async function renderizarPaginaImovel() {

    /* -------------------------------------------------
       PEGAR SLUG DA URL
    ------------------------------------------------- */

    const params = new URLSearchParams(window.location.search);
    const slug   = params.get("slug");

    if (!slug) return;

    /* -------------------------------------------------
       BUSCAR IMÓVEL
    ------------------------------------------------- */

    const imovel = await buscarImovelPorSlug(slug);

    if (!imovel) {
        console.error("Imóvel não encontrado");
        return;
    }

    /* -------------------------------------------------
       ELEMENTOS
    ------------------------------------------------- */

    const galeria = document.getElementById("imovel-galeria");
    const info    = document.getElementById("imovel-info");
    const conteudo = document.getElementById("imovel-conteudo");

    if (!galeria || !info) return;

    inicializarGaleria(galeria, imovel);

    /* -------------------------------------------------
       PREÇO E DADOS PRINCIPAIS
    ------------------------------------------------- */

    const preco  = formatarPreco(imovel.preco?.valor);
    const statusNormalizado =
        textoSeguro(imovel.status).toLowerCase();
    const imovelAlugado =
        statusNormalizado === "alugado";

    const bairro = imovel.localizacao?.bairro || imovel.bairro || "";
    const cidade = imovel.localizacao?.cidade || imovel.cidade || "";
    const estado = imovel.localizacao?.estado || imovel.estado || "";

    const whatsapp = imovel.contato?.whatsapp || CONFIG.WHATSAPP;
    const urlAtual = urlCanonicaImovel(imovel.slug);
    const titulo   = textoSeguro(imovel.titulo).trim() || "Imovel";
    const mensagemContato =
        `Olá Stephanie, tenho interesse neste imóvel: ${titulo}\n\n${urlAtual}`;

    const descricaoResumo =
        textoSeguro(imovel.seo?.description).trim() ||
        textoSeguro(imovel.descricao?.resumo).trim() ||
        `${textoSeguro(imovel.tipo).trim() || "Imovel"} em ${bairro || CONFIG.CIDADE_PADRAO}, ${estado || CONFIG.ESTADO_PADRAO}.`;

    const imagemCompartilhamento = imagemAbsoluta(
        imovel.midia?.thumbnail   ||
        imovel.midia?.galeria?.[0] ||
        CONFIG.IMAGE_FALLBACK
    );

    /* -------------------------------------------------
       DIFERENCIAIS
    ------------------------------------------------- */

    const diferenciaisGenericos = new Set([
        "cozinha",
        "sala",
        "banheiro",
        "quarto",
        "quartos",
        "área de serviço",
        "area de servico"
    ]);

    const diferenciaisFortes = arraySeguro(imovel.diferenciais)
        .filter(item =>
            !diferenciaisGenericos.has(
                textoSeguro(item).trim().toLowerCase()
            )
        );

    const diferenciais = diferenciaisFortes
    .map(item => `
        <div class="diferencial-chip">
            <i class="fa-solid fa-check"></i>
            <span>${item}</span>
        </div>
    `)
    .join("");

    /* -------------------------------------------------
       DESCRIÇÃO
    ------------------------------------------------- */

    const descricao = (imovel.descricao?.completa || [])
    .map((texto,index) => `

        <div class="descricao-bloco ${index === 0 ? 'descricao-principal' : ''}">

            ${texto}

        </div>

    `)
    .join("");

    const descricaoHighlight = diferenciaisFortes
    .slice(0, 3)
    .map(item => `
        <span>
            <i class="fa-solid fa-check"></i>
            ${item}
        </span>
    `)
    .join("");

    /* -------------------------------------------------
       CARACTERÍSTICAS
    ------------------------------------------------- */

    const caracteristicas = `
        <div class="imovel-caracteristicas">

            ${imovel.caracteristicas?.quartos > 0 ? `
                <div class="caracteristica-item">
                    <i class="fa-solid fa-bed"></i>
                    ${imovel.caracteristicas.quartos} Quartos
                </div>` : ""}

            ${imovel.caracteristicas?.banheiros > 0 ? `
                <div class="caracteristica-item">
                    <i class="fa-solid fa-bath"></i>
                    ${imovel.caracteristicas.banheiros} Banheiros
                </div>` : ""}

            ${imovel.caracteristicas?.vagas > 0 ? `
                <div class="caracteristica-item">
                    <i class="fa-solid fa-car"></i>
                    ${imovel.caracteristicas.vagas} Vagas
                </div>` : ""}

            ${imovel.caracteristicas?.suites > 0 ? `
                <div class="caracteristica-item">
                    <i class="fa-solid fa-star"></i>
                    ${imovel.caracteristicas.suites} Suíte(s)
                </div>` : ""}

            ${imovel.metragem?.areaConstruida > 0 ? `
                <div class="caracteristica-item">
                    <i class="fa-solid fa-ruler-combined"></i>
                    ${imovel.metragem.areaConstruida} m² Construídos
                </div>` : ""}

            ${imovel.metragem?.areaTerreno > 0 ? `
                <div class="caracteristica-item">
                    <i class="fa-solid fa-tree"></i>
                    ${imovel.metragem.areaTerreno} m² Terreno
                </div>` : ""}

        </div>
    `;

    /* -------------------------------------------------
       BREADCRUMB
    ------------------------------------------------- */

    const breadcrumb = document.getElementById("breadcrumb");

    if (breadcrumb) {

        const paginaFinalidade =
    imovel.finalidade?.toLowerCase() === "aluguel"
        ? "aluguel.html"
        : "comprar.html";
        breadcrumb.innerHTML = `
    <a href="index.html">Início</a>

    <span>/</span>

    <a href="${paginaFinalidade}">
        ${imovel.finalidade}
    </a>

    <span>/</span>

    <span>
        ${imovel.titulo}
    </span>
`;
    }

    /* -------------------------------------------------
       INFO
    ------------------------------------------------- */

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

    ${imovelAlugado ? `
    <div class="aviso-imovel-alugado">

        <strong>
            Este im&oacute;vel j&aacute; foi alugado.
        </strong>

        <p>
            Mas temos outros im&oacute;veis semelhantes dispon&iacute;veis para loca&ccedil;&atilde;o.
        </p>

        <a href="aluguel.html">
            Ver outros im&oacute;veis
        </a>

    </div>
    ` : ""}

    <div class="imovel-localizacao">
        <i class="fa-solid fa-location-dot"></i>
        <span>
            ${bairro}, ${cidade} - ${estado}
        </span>
    </div>

   <div class="imovel-meta">

    <div class="imovel-codigo">

        <span>
            C&oacute;digo:
        </span>

        <strong>
            ${imovel.codigo || "N/D"}
        </strong>

    </div>

    <div class="imovel-badges">

        ${imovel.tagPrincipal ? `

        <div class="imovel-tag-principal">

            ${imovel.tagPrincipal}

        </div>

        ` : ""}

        <div class="imovel-status">

            <span
            class="status-badge status-${(imovel.status || "").toLowerCase()}">

                ${(imovel.status || "Disponivel")
                    .replace("Disponivel", "Disponível")}

            </span>

        </div>

    </div>

</div>

    ${imovelAlugado ? `
    <button
        class="imovel-whatsapp-principal imovel-whatsapp-indisponivel"
        type="button"
        disabled>

        <i class="fa-solid fa-check"></i>

        <span>
            Este im&oacute;vel j&aacute; foi alugado
        </span>

    </button>
    ` : `
    <a
        class="imovel-whatsapp-principal"
        target="_blank"
        rel="noopener noreferrer"
        href="https://wa.me/${whatsapp}?text=${encodeURIComponent(mensagemContato)}">

        <i class="fab fa-whatsapp"></i>

        <span>
            Falar no WhatsApp
        </span>

    </a>
    `}


    <div class="imovel-compartilhar">

        <h3>
            Compartilhar imóvel
        </h3>

        <div class="compartilhar-botoes">

            <button
            id="compartilhar-whatsapp"
            class="btn-compartilhar"
            type="button"
            aria-label="Compartilhar im&oacute;vel pelo WhatsApp"
            title="Compartilhar im&oacute;vel pelo WhatsApp">

                <i class="fab fa-whatsapp"></i>

                WhatsApp

            </button>

            <button
            id="compartilhar-facebook"
            class="btn-compartilhar"
            type="button"
            aria-label="Compartilhar im&oacute;vel no Facebook"
            title="Compartilhar im&oacute;vel no Facebook">

                <i class="fab fa-facebook-f"></i>

                Facebook

            </button>

            <button
            id="copiar-link"
            class="btn-compartilhar"
            type="button"
            aria-label="Copiar link do im&oacute;vel"
            title="Copiar link do im&oacute;vel">

                <i class="fa-solid fa-link"></i>

                Copiar Link

            </button>

        </div>

    </div>

`;

conteudo.innerHTML = `
<section class="bloco-imovel">

    <h2 class="section-title-imovel">Características</h2>

    ${caracteristicas}

</section>

<section class="bloco-imovel">

    <h2 class="section-title-imovel">Descrição do imóvel</h2>

    <div class="descricao-highlight">

        ${descricaoHighlight}

    </div>

    <div class="descricao-imovel">

        ${descricao}

    </div>

</section>

<section class="bloco-imovel">

    <h2 class="section-title-imovel">Diferenciais</h2>

    <div class="lista-diferenciais">

    ${diferenciais}

    </div>

</section>
`;

    /* -------------------------------------------------
       IMÓVEIS RELACIONADOS
    ------------------------------------------------- */

    const containerRelacionados = document.getElementById("imoveis-relacionados");

    if (containerRelacionados) {

        const todosImoveis = await carregarImoveis();

        const relacionados = todosImoveis
            .filter(item =>
                item.slug !== imovel.slug &&
                item.finalidade === imovel.finalidade
            )
            .slice(0, 3);

        if (relacionados.length > 0) {

            containerRelacionados.innerHTML = `
                <h2 class="titulo-relacionados section-title-imovel">Você também pode gostar</h2>
                <div class="relacionados-grid">
                    ${relacionados.map(item => {

                        const imagem =
                            item.midia?.thumbnail   ||
                            item.midia?.galeria?.[0] ||
                            CONFIG.IMAGE_FALLBACK;

                        const precoRelacionado    = formatarPreco(item.preco?.valor);
                        const bairroRelacionado   = item.localizacao?.bairro || item.bairro || "";
                        const cidadeRelacionada   = item.localizacao?.cidade || item.cidade || "";

                        return `
                            <article class="relacionado-card">
                                <img src="${imagem}" alt="${item.titulo}">
                                <div class="relacionado-content">
                                    <h3>${item.titulo}</h3>
                                    <div class="relacionado-local">
                                        ${bairroRelacionado}${cidadeRelacionada ? ` - ${cidadeRelacionada}` : ""}
                                    </div>
                                    <div class="relacionado-preco">${precoRelacionado}</div>
                                    <a class="relacionado-btn" href="${urlImovel(item.slug)}">
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

    /* -------------------------------------------------
   CTA FINAL CORRETORA
------------------------------------------------- */

const ctaFinal =
document.getElementById(
    "cta-corretora-final"
);

if (ctaFinal) {

    ctaFinal.innerHTML = `

        <div class="cta-final-card">

            <img
                src="assets/equipe/stephanie.webp"
                alt="Stephanie Campos"
            >

            <div class="cta-final-content">

                <span>
                    Atendimento Personalizado
                </span>

                <h3>
                    Ainda não encontrou o imóvel ideal?
                </h3>

                <p>
                    Está escolhendo alguém para conduzir uma das decisões mais importantes da sua vida.

                    Meu compromisso é oferecer um atendimento transparente, humano e sem pressão, ajudando você a encontrar o imóvel certo no seu tempo e com total segurança.

                    Cada visita, cada negociação e cada etapa são acompanhadas de perto para que sua experiência seja tranquila do início ao fim.
                </p>

                <a
                    target="_blank"
                    href="https://wa.me/${whatsapp}">

                    Falar no WhatsApp

                </a>

            </div>

        </div>

    `;

}
    /* -------------------------------------------------
       SEO DINÂMICO
    ------------------------------------------------- */

    document.title = imovel.seo?.title || `${titulo} | ${CONFIG.SITE_NAME}`;

    upsertMeta(
        'meta[name="description"]',
        "name",
        "description",
        descricaoResumo
    );

    upsertMeta(
        'meta[property="og:type"]',
        "property",
        "og:type",
        "website"
    );

    upsertMeta(
        'meta[property="og:title"]',
        "property",
        "og:title",
        titulo
    );

    upsertMeta(
        'meta[property="og:description"]',
        "property",
        "og:description",
        descricaoResumo
    );

    upsertMeta(
        'meta[property="og:image"]',
        "property",
        "og:image",
        imagemCompartilhamento
    );

    upsertMeta(
        'meta[property="og:url"]',
        "property",
        "og:url",
        urlAtual
    );

    /* -------------------------------------------------
TWITTER CARD
------------------------------------------------- */

upsertMeta(
    'meta[name="twitter:card"]',
    "name",
    "twitter:card",
    "summary_large_image"
);

upsertMeta(
    'meta[name="twitter:title"]',
    "name",
    "twitter:title",
    titulo
);

upsertMeta(
    'meta[name="twitter:description"]',
    "name",
    "twitter:description",
    descricaoResumo
);

upsertMeta(
    'meta[name="twitter:image"]',
    "name",
    "twitter:image",
    imagemCompartilhamento
);
    /* -------------------------------------------------
   CANONICAL URL
------------------------------------------------- */

let canonical = document.querySelector('link[rel="canonical"]');

if (!canonical) {

    canonical = document.createElement("link");

    canonical.setAttribute(
        "rel",
        "canonical"
    );

    document.head.appendChild(
        canonical
    );
}

canonical.setAttribute(
    "href",
    urlAtual
);

/* -------------------------------------------------
SCHEMA BREADCRUMBLIST
------------------------------------------------- */

const breadcrumbSchema = {

    "@context": "https://schema.org",

    "@type": "BreadcrumbList",

    "itemListElement": [

        {
            "@type": "ListItem",
            "position": 1,
            "name": "Início",
            "item": CONFIG.SITE_URL
        },

        {
            "@type": "ListItem",
            "position": 2,
            "name":
                imovel.finalidade === "Venda"
                ? "Comprar"
                : "Alugar",

            "item":
                imovel.finalidade === "Venda"
                ? `${CONFIG.SITE_URL}/comprar.html`
                : `${CONFIG.SITE_URL}/aluguel.html`
        },

        {
            "@type": "ListItem",
            "position": 3,
            "name": titulo,
            "item": urlAtual
        }

    ]

};

let breadcrumbScript =
    document.getElementById(
        "breadcrumb-schema"
    );

if (!breadcrumbScript) {

    breadcrumbScript =
        document.createElement("script");

    breadcrumbScript.type =
        "application/ld+json";

    breadcrumbScript.id =
        "breadcrumb-schema";

    document.head.appendChild(
        breadcrumbScript
    );
}

breadcrumbScript.textContent =
    JSON.stringify(
        breadcrumbSchema
    );

    /* -------------------------------------------------
SCHEMA REALESTATELISTING
------------------------------------------------- */

const enderecoSchema = {

    "@type": "PostalAddress",

    "addressLocality": cidade,

    "addressRegion": estado,

    "addressCountry": "BR",

    "addressNeighborhood": bairro

};

const ofertaSchema = {

    "@type": "Offer",

    "price":
        Number(
            imovel.preco?.valor || 0
        ),

    "priceCurrency": "BRL",

    "url": urlAtual,

    "availability":
        imovel.status?.toLowerCase() === "vendido" ||
        imovel.status?.toLowerCase() === "alugado"
            ? "https://schema.org/SoldOut"
            : "https://schema.org/InStock"

};

const residenciaSchema = {

    "@type": "Residence",

    "@id": `${urlAtual}#residence`,

    "name": titulo,

    "description":
        imovel.seo?.description ||
        descricaoResumo,

    "address": enderecoSchema,

    "numberOfRooms":
        Number(
            imovel.caracteristicas?.quartos || 0
        ),

    "numberOfBathroomsTotal":
        Number(
            imovel.caracteristicas?.banheiros || 0
        ),

    "floorSize": {

        "@type": "QuantitativeValue",

        "value":
            Number(
                imovel.metragem?.areaConstruida || 0
            ),

        "unitCode": "MTK"

    }

};

const listingSchema = {

    "@context": "https://schema.org",

    "@graph": [

        {
            "@type": "RealEstateListing",

            "@id": `${urlAtual}#listing`,

            "name": titulo,

            "description":
                imovel.seo?.description ||
                descricaoResumo,

            "url": urlAtual,

            "identifier": imovel.codigo || "",

            "image": [
                imagemCompartilhamento
            ],

            "mainEntity": {
                "@id": `${urlAtual}#residence`
            },

            "offers": ofertaSchema
        },

        residenciaSchema

    ]

};

let listingScript =
    document.getElementById(
        "listing-schema"
    );

if (!listingScript) {

    listingScript =
        document.createElement("script");

    listingScript.type =
        "application/ld+json";

    listingScript.id =
        "listing-schema";

    document.head.appendChild(
        listingScript
    );
}

listingScript.textContent =
    JSON.stringify(
        listingSchema
    ); 
    
    /* -------------------------------------------------
       COMPARTILHAMENTO
    ------------------------------------------------- */

    document.getElementById("compartilhar-whatsapp")?.addEventListener("click", () => {
        const mensagem = `${titulo}\n\n${urlAtual}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, "_blank");
    });

    document.getElementById("compartilhar-facebook")?.addEventListener("click", () => {
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlAtual)}`,
            "_blank"
        );
    });

    document.getElementById("copiar-link")?.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(urlAtual);
            mostrarToastCompartilhamento("Link copiado com sucesso!");
        } catch (error) {
            console.error(error);
        }
    });

} // ← fecha renderizarPaginaImovel
