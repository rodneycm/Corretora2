export function inicializarScrollTop() {

    const botao = document.getElementById("scroll-top");

    if (!botao) return;

    function controlarVisibilidade() {

        if (window.scrollY > 400) {

            botao.classList.add("ativo");

        } else {

            botao.classList.remove("ativo");
        }
    }

    window.addEventListener(
        "scroll",
        controlarVisibilidade
    );

    botao.addEventListener(
        "click",
        () => {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );

    controlarVisibilidade();
}