import CONFIG from "../core/config.js";

function textoSeguro(valor) {

    return typeof valor === "string"
        ? valor
        : "";

}

function numeroSeguro(valor) {

    return Number(valor) || 0;

}

export function formatarPreco(valor) {

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

        const codigo =
    textoSeguro(
        imovel?.codigo
    );

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

let badgeStatus = "";

if (
    status.toLowerCase() === "vendido"
) {

    badgeStatus = `

    <span class="badge-status badge-vendido">
        Vendido
    </span>

    `;

}

if (
    status.toLowerCase() === "alugado"
) {

    badgeStatus = `

    <span class="badge-status badge-alugado">
        Alugado
    </span>

    `;

}

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
        ${areaConstruida}m²
    </span>
    ` : ""}

</div>

`;

    return `

    <article class="imovel-card">

        <div class="imovel-image">

    ${badgeDestaque}

    ${badgeFinalidade}

    ${badgeMobiliado}

    ${badgeStatus}

            <img
                loading="lazy"
                src="${imagemPrincipal}"
                alt="${titulo}">

        </div>

        <div class="imovel-content">

            <div class="codigo-imovel">

            ${codigo}

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

            <a
                class="imovel-btn"
                href="${urlImovel(imovel.slug)}">

                Ver imóvel

            </a>

        </div>

    </article>

    `;

}