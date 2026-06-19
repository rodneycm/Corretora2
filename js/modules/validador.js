const STATUS_VALIDOS = [
    "disponivel",
    "reservado",
    "em-analise",
    "alugado",
    "vendido",
    "indisponivel",
    "manutencao"
];

const FINALIDADES_VALIDAS = [
    "venda",
    "aluguel"
];

function textoSeguro(valor) {
    return typeof valor === "string" ? valor.trim() : "";
}

function objetoSeguro(valor) {
    return valor && typeof valor === "object" && !Array.isArray(valor);
}

function normalizarTexto(valor) {
    return textoSeguro(valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, "-");
}

function precoNumerico(preco) {
    if (!objetoSeguro(preco)) return false;

    if (typeof preco.valor === "number") {
        return Number.isFinite(preco.valor);
    }

    if (typeof preco.valor === "string") {
        return preco.valor.trim() !== "" &&
            Number.isFinite(Number(preco.valor));
    }

    return false;
}

function possuiGaleria(midia) {
    return objetoSeguro(midia) &&
        Array.isArray(midia.galeria) &&
        midia.galeria.length > 0;
}

function avisar(imovel, campo) {
    const titulo =
        textoSeguro(imovel?.titulo) ||
        textoSeguro(imovel?.id) ||
        "Imovel sem identificacao";

    console.warn(`[Corretora2]\n\nImóvel: ${titulo}\n\nCampo inválido:\n\n${campo}`);
}

export function validarImovel(imovel) {
    if (!objetoSeguro(imovel)) {
        avisar(imovel, "imovel");
        return;
    }

    if (!textoSeguro(imovel.id)) avisar(imovel, "id");
    if (!textoSeguro(imovel.slug)) avisar(imovel, "slug");
    if (!textoSeguro(imovel.titulo)) avisar(imovel, "titulo");
    if (!precoNumerico(imovel.preco)) avisar(imovel, "preco");
    if (!textoSeguro(imovel.bairro)) avisar(imovel, "bairro");
    if (!textoSeguro(imovel.cidade)) avisar(imovel, "cidade");
    if (!textoSeguro(imovel.estado)) avisar(imovel, "estado");
    if (!objetoSeguro(imovel.midia)) avisar(imovel, "midia");
    if (!possuiGaleria(imovel.midia)) avisar(imovel, "midia.galeria");
    if (!objetoSeguro(imovel.caracteristicas)) avisar(imovel, "caracteristicas");

    if (!STATUS_VALIDOS.includes(normalizarTexto(imovel.status))) {
        avisar(imovel, "status");
    }

    if (!FINALIDADES_VALIDAS.includes(normalizarTexto(imovel.finalidade))) {
        avisar(imovel, "finalidade");
    }
}

export function validarLista(lista) {
    if (!Array.isArray(lista)) {
        console.warn("[Corretora2]\n\nLista de imóveis inválida.");
        return;
    }

    lista.forEach(validarImovel);
}
