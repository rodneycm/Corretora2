async function loadComponent(elementId, filePath){

    const element = document.getElementById(elementId);

    if(!element) return;

    try{

        const response = await fetch(filePath);

        const html = await response.text();

        element.innerHTML = html;

    }catch(error){

        console.error(
        "Erro ao carregar componente:",
        filePath
        );

    }

}

loadComponent(
"header-component",
"/Corretora2/components/header.html"
);

loadComponent(
"footer-component",
"/Corretora2/components/footer.html"
);