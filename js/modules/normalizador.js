const BUSCA_PADRAO = {
    sinonimos: [],
    palavrasChave: []
};

const CLASSIFICACAO_PADRAO = {
    tipoConstrucao: "",
    padrao: "",
    perfil: "",
    investimento: false,
    aceitaFinanciamento: false
};

const SEO_PADRAO = {
    canonical: "",
    ogImage: ""
};

const MIDIA_PADRAO = {
    tour360: ""
};

const SISTEMA_PADRAO = {
    ordem: 9999,
    dataPublicacao: "",
    dataExpiracao: "",
    ultimaVisualizacao: "",
    ultimaEdicao: ""
};

function objetoSeguro(valor) {
    return valor && typeof valor === "object" && !Array.isArray(valor)
        ? valor
        : {};
}

function arraySeguro(valor) {
    return Array.isArray(valor) ? valor : [];
}

// Garante os grupos novos sem alterar os dados originais recebidos.
export function normalizarImovel(imovel) {
    const dados = objetoSeguro(imovel);
    const busca = objetoSeguro(dados.busca);

    return {
        ...dados,
        busca: {
            ...BUSCA_PADRAO,
            ...busca,
            sinonimos: arraySeguro(busca.sinonimos),
            palavrasChave: arraySeguro(busca.palavrasChave)
        },
        comodidades: arraySeguro(dados.comodidades),
        classificacao: {
            ...CLASSIFICACAO_PADRAO,
            ...objetoSeguro(dados.classificacao)
        },
        seo: {
            ...SEO_PADRAO,
            ...objetoSeguro(dados.seo)
        },
        midia: {
            ...MIDIA_PADRAO,
            ...objetoSeguro(dados.midia)
        },
        sistema: {
            ...SISTEMA_PADRAO,
            ...objetoSeguro(dados.sistema)
        }
    };
}

export function normalizarLista(lista) {
    return arraySeguro(lista).map(normalizarImovel);
}
