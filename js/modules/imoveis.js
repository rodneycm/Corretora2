import CONFIG from "../core/config.js";
import { inicializarGaleria } from "./galeria.js";
import { normalizarLista } from "./normalizador.js";
import { validarLista } from "./validador.js";

import {
    criarCard,
    formatarPreco,
    urlImovel
} from "./cards.js";

import {
    filtrarPorBairro,
    filtrarPorQuartos,
    filtrarPorPreco,
    ordenarImoveis as ordenarImoveisPorFiltro
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

function ordenarImoveis(lista) {
    return [...arraySeguro(lista)].sort((a, b) => {
        const ordemA = Number(a?.sistema?.ordem);

        const ordemB = Number(b?.sistema?.ordem);

        return (
            Number.isFinite(ordemA) ? ordemA : 999999
        ) - (
            Number.isFinite(ordemB) ? ordemB : 999999
        );
    });
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

function upsertLink(seletor, rel, href) {
    let link = document.querySelector(seletor);

    if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", rel);
        document.head.appendChild(link);
    }

    link.setAttribute("href", href);
}

function normalizarEspacos(texto) {
    return textoSeguro(texto).replace(/\s+/g, " ").trim();
}

function limitarMetaDescription(texto) {
    let descricao = normalizarEspacos(texto);

    if (descricao.length < 140) {
        descricao = normalizarEspacos(
            `${descricao} Veja detalhes, fotos, localizacao e informacoes para agendar sua visita com atendimento especializado.`
        );
    }

    if (descricao.length <= 160) {
        return descricao;
    }

    const limite = descricao.slice(0, 157);
    const ultimoEspaco = limite.lastIndexOf(" ");

    return `${limite.slice(0, ultimoEspaco > 120 ? ultimoEspaco : 157).trim()}...`;
}

function gerarMetaDescriptionImovel(imovel, contexto) {
    const quartos = numeroSeguro(imovel?.caracteristicas?.quartos);
    const tipo = textoSeguro(imovel?.tipo).trim() || "Imovel";
    const bairro = textoSeguro(contexto.bairro).trim();
    const cidade = textoSeguro(contexto.cidade).trim() || CONFIG.CIDADE_PADRAO;
    const estado = textoSeguro(contexto.estado).trim() || CONFIG.ESTADO_PADRAO;
    const finalidade = textoSeguro(imovel?.finalidade).trim().toLowerCase();
    const dormitorios =
        quartos > 0
            ? ` com ${quartos} ${quartos === 1 ? "quarto" : "quartos"}`
            : "";
    const localizacao =
        bairro
            ? `${bairro}, ${cidade}/${estado}`
            : `${cidade}/${estado}`;

    return limitarMetaDescription(
        `${tipo}${dormitorios} ${finalidade ? `para ${finalidade} ` : ""}em ${localizacao}. Confira fotos, caracteristicas, valor e detalhes deste imovel.`
    );
}

function objetoComValores(dados) {
    return Object.fromEntries(
        Object.entries(dados).filter(([, valor]) => {
            if (valor === undefined || valor === null) return false;
            if (typeof valor === "string" && valor.trim() === "") return false;
            if (Array.isArray(valor) && valor.length === 0) return false;
            return true;
        })
    );
}

function aplicarSeoImovel(imovel, contexto) {
    const seoTitle = `${contexto.titulo} | ${CONFIG.SITE_NAME}`;
    const metaDescription = gerarMetaDescriptionImovel(imovel, contexto);
    const canonicalSeo =
        textoSeguro(imovel?.seo?.canonical).trim() ||
        contexto.urlAtual;
    const imagemCompartilhamento =
        textoSeguro(imovel?.seo?.ogImage).trim() ||
        contexto.imagemCompartilhamento;
    const latitudeTexto = textoSeguro(imovel?.localizacao?.latitude).trim();
    const longitudeTexto = textoSeguro(imovel?.localizacao?.longitude).trim();
    const latitude = Number(latitudeTexto);
    const longitude = Number(longitudeTexto);
    const possuiCoordenadas =
        latitudeTexto !== "" &&
        longitudeTexto !== "" &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude);
    const endereco = imovel?.endereco || {};
    const possuiEndereco =
        Boolean(
            textoSeguro(endereco.logradouro).trim() ||
            textoSeguro(endereco.numero).trim() ||
            textoSeguro(endereco.cep).trim() ||
            textoSeguro(contexto.bairro).trim() ||
            textoSeguro(contexto.cidade).trim() ||
            textoSeguro(contexto.estado).trim()
        );
    const postalAddress = possuiEndereco
        ? objetoComValores({
            "@type": "PostalAddress",
            "streetAddress": normalizarEspacos(
                `${textoSeguro(endereco.logradouro)} ${textoSeguro(endereco.numero)}`
            ),
            "addressLocality": contexto.cidade,
            "addressRegion": contexto.estado,
            "postalCode": textoSeguro(endereco.cep),
            "addressCountry": "BR",
            "addressNeighborhood": contexto.bairro
        })
        : undefined;
    const residence = objetoComValores({
        "@type": "Residence",
        "@id": `${contexto.urlAtual}#residence`,
        "name": contexto.titulo,
        "description": metaDescription,
        "address": postalAddress,
        "geo": possuiCoordenadas
            ? {
                "@type": "GeoCoordinates",
                "latitude": latitude,
                "longitude": longitude
            }
            : undefined,
        "numberOfRooms": numeroSeguro(imovel?.caracteristicas?.quartos) || undefined,
        "numberOfBathroomsTotal": numeroSeguro(imovel?.caracteristicas?.banheiros) || undefined,
        "floorSize": numeroSeguro(imovel?.metragem?.areaConstruida) > 0
            ? {
                "@type": "QuantitativeValue",
                "value": numeroSeguro(imovel?.metragem?.areaConstruida),
                "unitCode": "MTK"
            }
            : undefined
    });
    const offer = objetoComValores({
        "@type": "Offer",
        "price": numeroSeguro(imovel?.preco?.valor) || undefined,
        "priceCurrency": imovel?.preco?.moeda || CONFIG.MOEDA,
        "url": contexto.urlAtual,
        "availability":
            textoSeguro(imovel?.status).toLowerCase() === "vendido" ||
            textoSeguro(imovel?.status).toLowerCase() === "alugado"
                ? "https://schema.org/SoldOut"
                : "https://schema.org/InStock"
    });
    const schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": CONFIG.SITE_URL
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "Im\u00f3veis",
                        "item": `${CONFIG.SITE_URL}/`
                    },
                    {
                        "@type": "ListItem",
                        "position": 3,
                        "name": contexto.titulo,
                        "item": contexto.urlAtual
                    }
                ]
            },
            {
                "@type": "RealEstateListing",
                "@id": `${contexto.urlAtual}#listing`,
                "name": contexto.titulo,
                "description": metaDescription,
                "url": contexto.urlAtual,
                "identifier": textoSeguro(imovel?.codigo),
                "image": [imagemCompartilhamento],
                "mainEntity": {
                    "@id": `${contexto.urlAtual}#residence`
                },
                "offers": offer
            },
            residence
        ]
    };

    document.title = seoTitle;

    upsertMeta('meta[name="description"]', "name", "description", metaDescription);
    upsertMeta('meta[name="robots"]', "name", "robots", "index, follow");
    upsertMeta('meta[property="og:type"]', "property", "og:type", "website");
    upsertMeta('meta[property="og:title"]', "property", "og:title", seoTitle);
    upsertMeta('meta[property="og:description"]', "property", "og:description", metaDescription);
    upsertMeta('meta[property="og:image"]', "property", "og:image", imagemCompartilhamento);
    upsertMeta('meta[property="og:url"]', "property", "og:url", contexto.urlAtual);
    upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", seoTitle);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", metaDescription);
    upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", imagemCompartilhamento);
    upsertLink('link[rel="canonical"]', "canonical", canonicalSeo);

    document.getElementById("breadcrumb-schema")?.remove();
    document.getElementById("listing-schema")?.remove();

    let schemaScript = document.getElementById("imovel-schema");

    if (!schemaScript) {
        schemaScript = document.createElement("script");
        schemaScript.type = "application/ld+json";
        schemaScript.id = "imovel-schema";
        document.head.appendChild(schemaScript);
    }

    schemaScript.textContent = JSON.stringify(schema);

    return metaDescription;
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

        const imoveisNormalizados = normalizarLista(data.imoveis);

        validarLista(imoveisNormalizados);

        imoveisCache = ordenarImoveis(
            imoveisNormalizados.filter(
                item => item && item.sistema?.publicado !== false
            )
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
        resultado = ordenarImoveisPorFiltro(resultado, ordenacao);

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
        resultado = ordenarImoveisPorFiltro(resultado, ordenacao);

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
    const mensagemVisita =
        `Olá Stephanie, gostaria de agendar uma visita para este imóvel: ${titulo}\n\n${urlAtual}`;
    const whatsappContatoUrl =
        `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensagemContato)}`;
    const whatsappVisitaUrl =
        `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensagemVisita)}`;

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

    <div class="painel-conversao-imovel">

        <div class="painel-conversao-header">

            <h3>
                Gostou deste im&oacute;vel?
            </h3>

            <p>
                Nossa equipe est&aacute; pronta para tirar suas d&uacute;vidas e agendar uma visita.
            </p>

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

    <button
        class="imovel-agendar-visita imovel-whatsapp-indisponivel"
        type="button"
        disabled>

        <i class="fa-solid fa-calendar-check"></i>

        <span>
            Agendar Visita
        </span>

    </button>
    ` : `
    <a
        class="imovel-whatsapp-principal"
        target="_blank"
        rel="noopener noreferrer"
        href="${whatsappContatoUrl}">

        <i class="fab fa-whatsapp"></i>

        <span>
            Falar pelo WhatsApp
        </span>

    </a>

    <a
        class="imovel-agendar-visita"
        target="_blank"
        rel="noopener noreferrer"
        href="${whatsappVisitaUrl}">

        <i class="fa-solid fa-calendar-check"></i>

        <span>
            Agendar Visita
        </span>

    </a>
    `}

        <div class="confianca-imovel">

            <div>
                <i class="fa-solid fa-user-check"></i>
                <span>Atendimento personalizado</span>
            </div>

            <div>
                <i class="fa-solid fa-bolt"></i>
                <span>Resposta r&aacute;pida</span>
            </div>

            <div>
                <i class="fa-solid fa-calendar-check"></i>
                <span>Visitas agendadas</span>
            </div>

            <div>
                <i class="fa-solid fa-location-dot"></i>
                <span>Atendimento em Teres&oacute;polis</span>
            </div>

        </div>

        <div class="corretora-mini-card">

            <div class="corretora-mini-avatar">
                <img
                    src="assets/equipe/stephanie.webp"
                    alt="Stephanie Campos">
            </div>

            <div class="corretora-mini-info">

                <strong>
                    Stephanie Campos
                </strong>

                <span>
                    Consultoria Imobili&aacute;ria
                </span>

                <small>
                    CRECI
                </small>

                <p>
                    Atendimento especializado em compra, venda e loca&ccedil;&atilde;o de im&oacute;veis em Teres&oacute;polis.
                </p>

            </div>

        </div>

    </div>


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
                                <img
                                    src="${imagem}"
                                    alt="${item.titulo}"
                                    title="${item.titulo}"
                                    loading="lazy"
                                    decoding="async">
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
       SEO DINAMICO
    ------------------------------------------------- */

    aplicarSeoImovel(
        imovel,
        {
            titulo,
            bairro,
            cidade,
            estado,
            urlAtual,
            imagemCompartilhamento
        }
    );
    /* -------------------------------------------------
       COMPARTILHAMENTO
    ------------------------------------------------- */

    document.getElementById("compartilhar-whatsapp")?.addEventListener("click", () => {
        const valorImovel = numeroSeguro(imovel.preco?.valor);
        const linhaValor =
            valorImovel > 0
                ? `\n\n💰 ${preco}`
                : "";
        const localizacaoCompartilhamento =
            `${cidade || CONFIG.CIDADE_PADRAO}/${estado || CONFIG.ESTADO_PADRAO}`;
        const mensagem =
            `🏡 ${titulo}\n\n` +
            `📍 ${localizacaoCompartilhamento}` +
            `${linhaValor}\n\n` +
            `Confira este im\u00f3vel:\n\n` +
            `${urlAtual}`;

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
