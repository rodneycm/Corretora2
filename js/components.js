async function loadComponent(elementId, filePath){

    const element = document.getElementById(elementId);

    if(!element) return;

    try{

        const response = await fetch(filePath);

        if(!response.ok){

            throw new Error(`Erro ao carregar ${filePath}`);

        }

        const html = await response.text();

        element.innerHTML = html;

    }catch(error){

        console.error(
            "Erro ao carregar componente:",
            filePath,
            error
        );

    }

}

document.addEventListener("DOMContentLoaded", () => {

    loadComponent(
        "header-component",
        "components/header.html"
    );

    loadComponent(
        "footer-component",
        "components/footer.html"
    );

});