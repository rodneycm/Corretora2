import {
    criarStatusBadge,
    criarStatusOverlay,
    statusIndisponivel
} from "./status.js";

export function inicializarGaleria(galeria, imovel) {

    const imovelIndisponivel =
        statusIndisponivel(imovel);

    const badgeStatus =
        criarStatusBadge(
            imovel,
            "galeria"
        );

    const overlayStatus =
        criarStatusOverlay(
            imovel,
            "galeria"
        );

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

    <div class="foto-principal ${imovelIndisponivel ? "foto-principal-indisponivel" : ""}">

        ${badgeStatus}

        ${overlayStatus}

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

            if(event.key === "ArrowLeft") {

                document
                    .getElementById(
                        "btn-anterior"
                    )
                    ?.click();

            }

            if(event.key === "ArrowRight") {

                document
                    .getElementById(
                        "btn-proximo"
                    )
                    ?.click();

            }

        }
    );

    imagemPrincipal.style.cursor = "zoom-in";

    imagemPrincipal.addEventListener(
        "click",
        () => {

            const lightbox =
                document.createElement("div");

            lightbox.className =
                "lightbox-imovel";

            lightbox.innerHTML = `

                <button class="lightbox-fechar">
                    <i class="fa-solid fa-xmark"></i>
                </button>

                <button class="lightbox-nav lightbox-anterior">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>

                <img
                    class="lightbox-img"
                    src="${galeriaImagens[indiceAtual]}">

                <button class="lightbox-nav lightbox-proximo">
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

                    if(event.target === lightbox) {

                        fecharLightbox();

                    }

                }
            );

            function tecladoLightbox(event) {

                if(event.key === "Escape") {

                    fecharLightbox();

                }

                if(event.key === "ArrowLeft") {

                    lightbox
                        .querySelector(
                            ".lightbox-anterior"
                        )
                        .click();

                }

                if(event.key === "ArrowRight") {

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

}
