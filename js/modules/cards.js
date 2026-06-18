import CONFIG from "../core/config.js";

import {
    criarBotaoCardContatoStatus,
    criarPrecoStatus,
    criarStatusBadge,
    criarStatusOverlay,
    statusIndisponivel
} from "./status.js";

function textoSeguro(valor) {

    return typeof valor === "string"
        ? valor
        : "";

}

function numeroSeguro(valor) {

    return Number(valor) || 0;

}

export function formatarPreco(valor) {

    const preco = numeroSeguro(valor);

    return preco.toLocaleString(

        "pt-BR",

        {
            style: "currency",
            currency: "BRL"
        }

    );

}

export function urlImovel(slug) {

    return `imovel.html?slug=${encodeURIComponent(slug)}`;

}

export function criarCard(imovel) {

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

    const precoFormatado =

        formatarPreco(
            imovel?.preco?.valor
        );

    const preco =
        criarPrecoStatus(
            imovel,
            precoFormatado
        );

    const titulo =

        textoSeguro(
            imovel?.titulo
        )

        ||

        "Imóvel";

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

    const codigo = textoSeguro(imovel?.codigo);

    const tagPrincipal = textoSeguro(imovel?.tagPrincipal);

    const areaConstruida =
        numeroSeguro(
            imovel?.metragem?.areaConstruida
        );

    const mobiliado =
        Boolean(
            imovel?.caracteristicas?.mobiliado
        );

    const destaque =
        Boolean(
            imovel?.destaque
        );

    const whatsapp =
        textoSeguro(
            imovel?.contato?.whatsapp
        )

        ||

        CONFIG.WHATSAPP;

    const mensagemWhatsapp =
        `Olá Stephanie, tenho interesse neste imóvel: ${titulo}`;

    const whatsappUrl =
        `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensagemWhatsapp)}`;

    const imovelIndisponivel =
        statusIndisponivel(imovel);

    const badgeStatus =
        criarStatusBadge(
            imovel,
            "card"
        );

    const overlayStatus =
        criarStatusOverlay(
            imovel,
            "card"
        );

    const botaoContato =
        criarBotaoCardContatoStatus(
            imovel,
            whatsappUrl
        );

    const badgeDestaque =

        destaque

        ?

    `

    <span class="badge-destaque">
        ⭐ Destaque
    </span>

    `

        :

        "";

    const badgeMobiliado =

    mobiliado

    ?

    `

    <span class="badge-mobiliado">
        🛋️ Mobiliado
    </span>

    `

    :

    "";

    const badgeFinalidade =

        finalidade

        ?

    `

    <span class="badge-finalidade">
        ${finalidade}
    </span>

    `

        :

        "";
    
    const resumoCaracteristicas = `

<div class="card-caracteristicas">

    ${quartos > 0 ? `
    <span>
        <i class="fa-solid fa-bed"></i>
        ${quartos} Quartos
    </span>
    ` : ""}

    ${banheiros > 0 ? `
    <span>
        <i class="fa-solid fa-bath"></i>
        ${banheiros} Banheiros
    </span>
    ` : ""}

    ${vagas > 0 ? `
    <span>
        <i class="fa-solid fa-car"></i>
        ${vagas} Vagas
    </span>
    ` : ""}

    ${areaConstruida > 0 ? `
    <span>
        <i class="fa-solid fa-ruler-combined"></i>
        ${areaConstruida} m²
    </span>
    ` : ""}

</div>

`;

    return `

    <article class="imovel-card ${imovelIndisponivel ? "imovel-card-indisponivel" : ""}">

        <div class="imovel-image">

    ${badgeStatus}

    ${badgeDestaque}

    ${badgeFinalidade}

    ${badgeMobiliado}

    ${overlayStatus}

            <img
                loading="lazy"
                src="${imagemPrincipal}"
                alt="${titulo}">

        </div>

        <div class="imovel-content">

            <div class="codigo-wrapper">

    ${codigo ? `
    <div class="codigo-imovel">

        <span>
            Código:
        </span>

        <strong>
            ${codigo}
        </strong>

    </div>
    ` : ""}

    ${tagPrincipal ? `
    <div class="tag-principal-imovel">

        ${tagPrincipal}

    </div>
    ` : ""}

</div>

<h3>${titulo}</h3>

            <p>${resumo}</p>

            ${resumoCaracteristicas}

            <div class="imovel-info">

                <span>
                    📍 ${bairro}
                </span>

                <span>
                    💰 ${preco}
                </span>

            </div>

            ${botaoContato}

            <a
                class="imovel-btn"
                href="${urlImovel(imovel.slug)}">

                Ver imóvel

            </a>

        </div>

    </article>

    `;

}
