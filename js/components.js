async function loadComponent(elementId, filePath){

    const element =
    document.getElementById(elementId);

    if(!element) return;

    try{

        const response =
        await fetch(filePath);

        if(!response.ok){

            throw new Error(
                `Erro ao carregar ${filePath}`
            );

        }

        const html =
        await response.text();

        element.innerHTML = html;

        if (
    elementId === "footer-component"
) {

    const botao =
        document.getElementById(
            "scroll-top"
        );

    if (botao) {

        import("./ui/scroll-top.js")
            .then(module => {

                module.inicializarScrollTop();

            });

    }

}

        if(elementId === "header-component"){

            activateCurrentPage();

        }

    }catch(error){

        console.error(
            "Erro ao carregar componente:",
            filePath,
            error
        );

    }

}

/* =========================================================
MENU ATIVO
========================================================= */

function activateCurrentPage(){

    const currentPage =
    window.location.pathname.split("/").pop();

    const navLinks =
    document.querySelectorAll("nav a");

    navLinks.forEach(link => {

        const linkHref =
        link.getAttribute("href");

        if(!linkHref) return;

        const linkPage =
        linkHref.split("/").pop();

        if(
            currentPage === linkPage ||
            (
                currentPage === "" &&
                linkPage === "index.html"
            )
        ){

            link.classList.add("nav-active");

        }

    });

}

/* =========================================================
LOAD COMPONENTS
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadComponent(
            "header-component",
            "/Corretora2/components/header.html"
        );

        loadComponent(
            "footer-component",
            "/Corretora2/components/footer.html"
        );

    }
);