import CONFIG from "../core/config.js";

const LISTAS_COM_FILTROS = [
    "lista-imoveis",
    "lista-imoveis-aluguel"
];

function linkWhatsappEstadoVazio() {
    return `https://wa.me/${CONFIG.WHATSAPP}?text=Ol%C3%A1%20Stephanie,%20vim%20pelo%20site%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es.`;
}

function criarEstadoVazioFiltros() {
    return `
        <div class="section-title">
            <h2>
                Nenhum imóvel encontrado
            </h2>

            <p>
                Não encontramos imóveis com os filtros selecionados.
                <br>
                <br>
                Experimente ampliar sua busca ou fale conosco. Podemos indicar outras oportunidades que ainda não estão anunciadas.
            </p>

            <div class="filtros-imoveis">
                <button
                    type="button"
                    class="limpar-filtros-btn"
                    data-limpar-filtros-vazio>
                    Limpar filtros
                </button>

                <a
                    class="whatsapp-btn"
                    href="${linkWhatsappEstadoVazio()}"
                    target="_blank"
                    rel="noopener noreferrer">
                    Falar no WhatsApp
                </a>
            </div>
        </div>
    `;
}

function aprimorarEstadoVazio(container) {
    if (
        !container ||
        container.dataset.estadoVazioInteligente === "ativo"
    ) {
        return;
    }

    const estadoVazio =
        container.querySelector(".sem-imoveis");

    if (!estadoVazio) return;

    container.dataset.estadoVazioInteligente = "ativo";
    container.innerHTML = criarEstadoVazioFiltros();
}

function observarEstadosVazios() {
    const containers = LISTAS_COM_FILTROS
        .map(id => document.getElementById(id))
        .filter(Boolean);

    if (containers.length === 0) return;

    containers.forEach(container => {
        const observer = new MutationObserver(() => {
            container.dataset.estadoVazioInteligente = "";
            aprimorarEstadoVazio(container);
        });

        observer.observe(
            container,
            {
                childList: true,
                subtree: true
            }
        );

        aprimorarEstadoVazio(container);
    });
}

if (typeof document !== "undefined") {
    document.addEventListener(
        "click",
        event => {
            const botao =
                event.target.closest("[data-limpar-filtros-vazio]");

            if (!botao) return;

            document.getElementById("limpar-filtros")?.click();
        }
    );

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            observarEstadosVazios
        );
    } else {
        observarEstadosVazios();
    }
}

/* =========================================================
FILTRO POR BAIRRO
========================================================= */

export function filtrarPorBairro(
    imoveis,
    bairro
) {

    if (!bairro) {

        return imoveis;

    }

    return imoveis.filter(

        item =>

            (
                item.bairro || ""
            )
                .toLowerCase()
                .includes(
                    bairro.toLowerCase()
                )

    );

}

/* =========================================================
FILTRO POR QUARTOS
========================================================= */

export function filtrarPorQuartos(
    imoveis,
    quartos
) {

    if (!quartos) {

        return imoveis;

    }

    return imoveis.filter(

        item =>

            Number(
                item.caracteristicas?.quartos
            ) >= Number(quartos)

    );

}

/* =========================================================
FILTRO POR PREÇO MÁXIMO
========================================================= */

export function filtrarPorPreco(
    imoveis,
    precoMaximo
) {

    if (!precoMaximo) {

        return imoveis;

    }

    return imoveis.filter(

        item =>

            Number(
                item.preco?.valor
            ) <= Number(precoMaximo)

    );

}

/* =========================================================
ORDENAÇÃO
========================================================= */

export function ordenarImoveis(
    imoveis,
    tipo
) {

    const lista =
        [...imoveis];

    switch (tipo) {

        case "menor-preco":

            return lista.sort(

                (a, b) =>

                    Number(a.preco?.valor)

                    -

                    Number(b.preco?.valor)

            );

        case "maior-preco":

            return lista.sort(

                (a, b) =>

                    Number(b.preco?.valor)

                    -

                    Number(a.preco?.valor)

            );

        default:

            return lista;

    }

}
