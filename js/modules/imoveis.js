import CONFIG from "../core/config.js";
import { inicializarGaleria } from "./galeria.js";
import { normalizarLista } from "./normalizador.js";
import { validarLista } from "./validador.js";

import {
    criarCard,
    formatarPreco,
    urlImovel
} from "./cards.js";

import {
    filtrarPorBairro,
    filtrarPorQuartos,
    filtrarPorPreco,
    ordenarImoveis as ordenarImoveisPorFiltro
} from "./filtros.js";

let imoveisCache = [];
const HISTORICO_STORAGE_KEY = "corretora2_historico";
const HISTORICO_LIMITE = 20;

/* =========================================================
   UTILITÁRIOS
========================================================= */

function arraySeguro(valor) {
    return Array.isArray(valor) ? valor : [];
}

function textoSeguro(valor) {
    return typeof valor === "string" ? valor : "";
}

function numeroSeguro(valor) {
    return Number(valor) || 0;
}

function textoComparavel(valor) {
    return textoSeguro(valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function normalizarTextoBusca(valor) {
    return textoSeguro(valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function coletarTextos(valor) {
    if (Array.isArray(valor)) {
        return valor.flatMap(coletarTextos);
    }

    if (valor && typeof valor === "object") {
        return Object.values(valor).flatMap(coletarTextos);
    }

    return [valor];
}

function juntarTextosIndice(partes) {
    return arraySeguro(partes)
        .flatMap(coletarTextos)
        .map(normalizarTextoBusca)
        .filter(Boolean)
        .join(" ");
}

function ordemImovel(imovel) {
    const ordem = Number(imovel?.sistema?.ordem);

    return Number.isFinite(ordem) ? ordem : 999999;
}

function ordenarImoveis(lista) {
    return [...arraySeguro(lista)].sort((a, b) => {
        return ordemImovel(a) - ordemImovel(b);
    });
}

function localizacaoImovel(imovel, campo) {
    return (
        textoSeguro(imovel?.localizacao?.[campo]) ||
        textoSeguro(imovel?.[campo])
    );
}

function classificacaoImovel(imovel, campo) {
    return textoSeguro(imovel?.classificacao?.[campo]);
}

function caracteristicaNumerica(imovel, campo) {
    return numeroSeguro(imovel?.caracteristicas?.[campo]);
}

function precoImovel(imovel) {
    return numeroSeguro(imovel?.preco?.valor);
}

function diferencaPreco(imovelBase, imovelRelacionado) {
    return Math.abs(precoImovel(imovelBase) - precoImovel(imovelRelacionado));
}

function valoresIguais(valorA, valorB) {
    const comparavelA = textoComparavel(valorA);
    const comparavelB = textoComparavel(valorB);

    return comparavelA !== "" && comparavelA === comparavelB;
}

function valoresProximos(valorA, valorB, tolerancia = 1) {
    return valorA > 0 && valorB > 0 && Math.abs(valorA - valorB) <= tolerancia;
}

function precoSemelhante(imovelBase, imovelRelacionado) {
    const precoBase = precoImovel(imovelBase);
    const precoRelacionado = precoImovel(imovelRelacionado);

    if (precoBase <= 0 || precoRelacionado <= 0) return false;

    return Math.abs(precoBase - precoRelacionado) / precoBase <= 0.2;
}

function condominioImovel(imovel) {
    return (
        textoSeguro(imovel?.condominio) ||
        textoSeguro(imovel?.nomeCondominio) ||
        textoSeguro(imovel?.condominioNome) ||
        textoSeguro(imovel?.empreendimento) ||
        textoSeguro(imovel?.localizacao?.condominio) ||
        textoSeguro(imovel?.endereco?.condominio)
    );
}

function possuiTexto(valor) {
    return textoSeguro(valor).trim() !== "";
}

const termosDescricaoHighlight = [
    "primeira locação",
    "condomínio completo",
    "vista panorâmica",
    "vista livre",
    "área gourmet",
    "salão de festas",
    "aceita pet",
    "churrasqueira",
    "financiamento",
    "planejados",
    "mobiliado",
    "academia",
    "elevador",
    "portaria",
    "hospital",
    "shopping",
    "garagem",
    "piscina",
    "varanda",
    "escola",
    "centro",
    "suíte",
    "vaga"
];

function escaparRegex(valor) {
    return valor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function criarPadraoDescricaoHighlight(termo) {
    return escaparRegex(termo)
        .replace(/a/g, "[aáã]")
        .replace(/e/g, "[eé]")
        .replace(/i/g, "[ií]")
        .replace(/o/g, "[oóô]")
        .replace(/c/g, "[cç]")
        .replace(/\s+/g, "\\s+");
}

function destacarDescricao(texto) {
    return termosDescricaoHighlight.reduce((descricao, termo) => {
        const padrao = criarPadraoDescricaoHighlight(termo);
        const regex = new RegExp(`(^|[^\\p{L}\\p{N}_])(${padrao})(?=$|[^\\p{L}\\p{N}_])`, "giu");

        return descricao.replace(regex, "$1<span class=\"descricao-highlight\">$2</span>");
    }, textoSeguro(texto));
}

function possuiNumero(valor) {
    return numeroSeguro(valor) > 0;
}

function possuiCoordenada(valor) {
    if (typeof valor === "number") {
        return Number.isFinite(valor);
    }

    return possuiTexto(valor) && Number.isFinite(Number(valor));
}

function limitarScore(valor) {
    return Math.max(0, Math.min(100, Math.round(valor)));
}

export function gerarIndiceBusca(imovel) {
    const quartos = caracteristicaNumerica(imovel, "quartos");
    const banheiros = caracteristicaNumerica(imovel, "banheiros");
    const vagas = caracteristicaNumerica(imovel, "vagas");

    return juntarTextosIndice([
        imovel?.titulo,
        imovel?.subtitulo,
        localizacaoImovel(imovel, "bairro"),
        localizacaoImovel(imovel, "cidade"),
        localizacaoImovel(imovel, "estado"),
        imovel?.tipo,
        imovel?.categoria,
        imovel?.finalidade,
        imovel?.status,
        imovel?.tagPrincipal,
        imovel?.descricao?.resumo,
        imovel?.descricao?.completa,
        imovel?.diferenciais,
        imovel?.comodidades,
        imovel?.busca?.palavrasChave,
        imovel?.busca?.sinonimos,
        classificacaoImovel(imovel, "perfil"),
        classificacaoImovel(imovel, "padrao"),
        condominioImovel(imovel),
        quartos > 0 ? `${quartos} quartos` : "",
        banheiros > 0 ? `${banheiros} banheiros` : "",
        vagas > 0 ? `${vagas} vagas` : ""
    ]);
}

export function calcularScoreQualidade(imovel) {
    let score = 0;

    const descricaoCompleta = arraySeguro(imovel?.descricao?.completa);
    const galeria = arraySeguro(imovel?.midia?.galeria);
    const caracteristicas = imovel?.caracteristicas || {};
    const seo = imovel?.seo || {};
    const busca = imovel?.busca || {};

    if (possuiTexto(imovel?.titulo)) score += 6;
    if (possuiTexto(imovel?.subtitulo)) score += 3;
    if (possuiTexto(imovel?.descricao?.resumo)) score += 5;
    if (descricaoCompleta.length > 0) score += 8;
    if (descricaoCompleta.length >= 3) score += 4;

    if (possuiTexto(imovel?.midia?.thumbnail)) score += 4;
    if (galeria.length > 0) score += 6;
    if (galeria.length >= 5) score += 4;
    if (galeria.length >= 10) score += 3;
    if (possuiTexto(imovel?.midia?.videoTour) || possuiTexto(imovel?.midia?.youtube)) score += 3;
    if (possuiTexto(imovel?.midia?.tour360)) score += 3;

    if (possuiNumero(imovel?.preco?.valor)) score += 6;
    if (possuiNumero(caracteristicas.quartos)) score += 3;
    if (possuiNumero(caracteristicas.banheiros)) score += 3;
    if (possuiNumero(caracteristicas.vagas)) score += 2;
    if (possuiNumero(imovel?.metragem?.areaConstruida) || possuiNumero(imovel?.metragem?.areaTerreno)) score += 3;

    if (arraySeguro(imovel?.diferenciais).length > 0) score += 5;
    if (arraySeguro(imovel?.diferenciais).length >= 4) score += 2;
    if (arraySeguro(imovel?.comodidades).length > 0) score += 4;
    if (arraySeguro(imovel?.comodidades).length >= 5) score += 2;

    if (possuiTexto(seo.title)) score += 3;
    if (possuiTexto(seo.description)) score += 4;
    if (possuiTexto(seo.canonical)) score += 2;
    if (possuiTexto(seo.ogImage)) score += 2;
    if (arraySeguro(seo.keywords).length > 0) score += 2;
    if (arraySeguro(busca.palavrasChave).length > 0) score += 3;
    if (arraySeguro(busca.sinonimos).length > 0) score += 2;

    if (possuiTexto(imovel?.tipo)) score += 2;
    if (possuiTexto(imovel?.categoria)) score += 2;
    if (possuiTexto(imovel?.tagPrincipal)) score += 2;
    if (possuiTexto(classificacaoImovel(imovel, "tipoConstrucao"))) score += 2;
    if (possuiTexto(classificacaoImovel(imovel, "perfil"))) score += 2;
    if (possuiTexto(classificacaoImovel(imovel, "padrao"))) score += 2;

    if (possuiTexto(localizacaoImovel(imovel, "bairro"))) score += 2;
    if (possuiTexto(localizacaoImovel(imovel, "cidade"))) score += 2;
    if (possuiTexto(localizacaoImovel(imovel, "estado"))) score += 1;
    if (possuiCoordenada(imovel?.localizacao?.latitude) && possuiCoordenada(imovel?.localizacao?.longitude)) score += 3;

    if (possuiTexto(imovel?.contato?.corretor)) score += 1;
    if (possuiTexto(imovel?.contato?.telefone) || possuiTexto(imovel?.contato?.whatsapp)) score += 2;
    if (possuiTexto(imovel?.codigo)) score += 1;
    if (possuiTexto(imovel?.slug)) score += 1;
    if (imovel?.sistema?.publicado !== false) score += 2;
    if (Number.isFinite(Number(imovel?.sistema?.ordem))) score += 1;

    return limitarScore(score);
}

function textoBuscaDoCampo(valor) {
    return juntarTextosIndice([valor]);
}

function campoContemTermo(valor, termo) {
    const texto = textoBuscaDoCampo(valor);

    return texto !== "" && texto.includes(termo);
}

function indiceBuscaImovel(imovel) {
    return textoSeguro(imovel?.indiceBusca) || gerarIndiceBusca(imovel);
}

function scoreQualidadeImovel(imovel) {
    const score = Number(imovel?.scoreQualidade);

    return Number.isFinite(score) ? score : calcularScoreQualidade(imovel);
}

function pontuarResultadoBusca(imovel, termo) {
    let pontuacao = 0;

    if (campoContemTermo(imovel?.titulo, termo)) {
        pontuacao += 20;
    }

    if (campoContemTermo(imovel?.busca?.palavrasChave, termo)) {
        pontuacao += 15;
    }

    if (campoContemTermo(imovel?.busca?.sinonimos, termo)) {
        pontuacao += 12;
    }

    if (campoContemTermo(imovel?.diferenciais, termo)) {
        pontuacao += 10;
    }

    if (campoContemTermo(imovel?.comodidades, termo)) {
        pontuacao += 8;
    }

    if (campoContemTermo([imovel?.descricao?.resumo, imovel?.descricao?.completa], termo)) {
        pontuacao += 5;
    }

    if (
        campoContemTermo([
            localizacaoImovel(imovel, "bairro"),
            localizacaoImovel(imovel, "cidade"),
            localizacaoImovel(imovel, "estado")
        ], termo)
    ) {
        pontuacao += 3;
    }

    if (pontuacao === 0 && indiceBuscaImovel(imovel).includes(termo)) {
        pontuacao += 1;
    }

    return pontuacao;
}

export function buscarImoveis(termo, lista) {
    const termoBusca = normalizarTextoBusca(termo);
    const imoveis = arraySeguro(lista);

    if (termoBusca === "") {
        return [...imoveis];
    }

    return imoveis
        .map(imovel => ({
            imovel,
            pontuacao: pontuarResultadoBusca(imovel, termoBusca)
        }))
        .filter(resultado => resultado.pontuacao > 0)
        .sort((a, b) => {
            if (b.pontuacao !== a.pontuacao) {
                return b.pontuacao - a.pontuacao;
            }

            const qualidadeB = scoreQualidadeImovel(b.imovel);
            const qualidadeA = scoreQualidadeImovel(a.imovel);

            if (qualidadeB !== qualidadeA) {
                return qualidadeB - qualidadeA;
            }

            if (Boolean(b.imovel?.destaque) !== Boolean(a.imovel?.destaque)) {
                return Number(Boolean(b.imovel?.destaque)) - Number(Boolean(a.imovel?.destaque));
            }

            return ordemImovel(a.imovel) - ordemImovel(b.imovel);
        })
        .map(resultado => resultado.imovel);
}

function localStorageSeguro() {
    try {
        if (typeof window === "undefined" || !window.localStorage) {
            return null;
        }

        return window.localStorage;
    } catch (error) {
        return null;
    }
}

function lerHistoricoIds() {
    const storage = localStorageSeguro();

    if (!storage) return [];

    try {
        const dados = JSON.parse(storage.getItem(HISTORICO_STORAGE_KEY) || "[]");

        return arraySeguro(dados)
            .map(textoSeguro)
            .filter(Boolean)
            .slice(0, HISTORICO_LIMITE);
    } catch (error) {
        return [];
    }
}

export function registrarHistorico(imovel) {
    const storage = localStorageSeguro();
    const id = textoSeguro(imovel?.id).trim();

    if (!storage || id === "") return;

    try {
        const historico = lerHistoricoIds();
        const atualizado = [
            id,
            ...historico.filter(item => item !== id)
        ].slice(0, HISTORICO_LIMITE);

        storage.setItem(HISTORICO_STORAGE_KEY, JSON.stringify(atualizado));
    } catch (error) {
        // localStorage pode falhar em modo privado, quotas ou bloqueios do navegador.
    }
}

export function obterHistorico() {
    return lerHistoricoIds();
}

export function obterImoveisHistorico(listaImoveis) {
    const historico = obterHistorico();

    if (historico.length === 0) return [];

    try {
        const imoveisPorId = new Map(
            arraySeguro(listaImoveis)
                .filter(imovel => textoSeguro(imovel?.id).trim() !== "")
                .map(imovel => [textoSeguro(imovel.id).trim(), imovel])
        );

        return historico
            .map(id => imoveisPorId.get(id))
            .filter(Boolean);
    } catch (error) {
        return [];
    }
}

function mesmoImovel(imovelBase, candidato) {
    const slugBase = textoSeguro(imovelBase?.slug);
    const slugCandidato = textoSeguro(candidato?.slug);
    const idBase = textoSeguro(imovelBase?.id);
    const idCandidato = textoSeguro(candidato?.id);

    return (
        (slugBase !== "" && slugBase === slugCandidato) ||
        (idBase !== "" && idBase === idCandidato)
    );
}

export function obterImoveisAdjacentes(imovelAtual, lista) {
    try {
        const imoveis = arraySeguro(lista);
        const indiceAtual = imoveis.findIndex(
            item => mesmoImovel(imovelAtual, item)
        );

        if (indiceAtual < 0) {
            return {
                anterior: null,
                proximo: null
            };
        }

        return {
            anterior: indiceAtual > 0 ? imoveis[indiceAtual - 1] : null,
            proximo: indiceAtual < imoveis.length - 1 ? imoveis[indiceAtual + 1] : null
        };
    } catch (error) {
        return {
            anterior: null,
            proximo: null
        };
    }
}

function renderizarNavegacaoImoveis(imovelAtual, lista) {
    const containerRelacionados = document.getElementById("imoveis-relacionados");

    if (!containerRelacionados) return;

    document.getElementById("navegacao-imoveis")?.remove();

    const { anterior, proximo } = obterImoveisAdjacentes(imovelAtual, lista);
    const imovelAnterior = textoSeguro(anterior?.slug) ? anterior : null;
    const proximoImovel = textoSeguro(proximo?.slug) ? proximo : null;

    if (!imovelAnterior && !proximoImovel) return;

    const navegacao = document.createElement("nav");
    navegacao.id = "navegacao-imoveis";
    navegacao.className = [
        "navegacao-imoveis",
        !imovelAnterior ? "navegacao-imoveis-sem-anterior" : "",
        !proximoImovel ? "navegacao-imoveis-sem-proximo" : ""
    ].filter(Boolean).join(" ");
    navegacao.setAttribute("aria-label", "Navegação entre imóveis");

    navegacao.innerHTML = `
        ${imovelAnterior ? `
            <a
                class="navegacao-imovel-link navegacao-imovel-anterior"
                href="${urlImovel(imovelAnterior.slug)}">
                <span aria-hidden="true">←</span>
                Imóvel anterior
            </a>
        ` : ""}

        ${proximoImovel ? `
            <a
                class="navegacao-imovel-link navegacao-imovel-proximo"
                href="${urlImovel(proximoImovel.slug)}">
                Próximo imóvel
                <span aria-hidden="true">→</span>
            </a>
        ` : ""}
    `;

    containerRelacionados.insertAdjacentElement("afterend", navegacao);
}

function gerarResumoEstrategico(imovel) {
    const bairro = localizacaoImovel(imovel, "bairro").trim();
    const finalidade = textoSeguro(imovel?.finalidade).trim().toLowerCase();
    const tagPrincipal = textoSeguro(imovel?.tagPrincipal).trim();
    const perfil = classificacaoImovel(imovel, "perfil").trim().toLowerCase();
    const padrao = classificacaoImovel(imovel, "padrao").trim();
    const diferenciais = arraySeguro(imovel?.diferenciais)
        .map(item => textoSeguro(item).trim())
        .filter(Boolean);
    const comodidades = arraySeguro(imovel?.comodidades)
        .map(item => textoSeguro(item).trim())
        .filter(Boolean);
    const textos = [
        tagPrincipal,
        perfil,
        padrao,
        ...diferenciais,
        ...comodidades
    ];
    const indice = normalizarTextoBusca(textos.join(" "));
    const bairroTexto = bairro ? ` no bairro ${bairro}` : "";
    const regiaoTexto = bairro ? ` em ${bairro}` : "";
    const possui = termo => indice.includes(termo);
    const possuiAlgum = termos => termos.some(possui);
    const principalDiferencial = diferenciais.find(item => {
        const texto = normalizarTextoBusca(item);

        return !["localizacao privilegiada", "excelente localizacao"].includes(texto);
    });
    const beneficio = principalDiferencial || comodidades[0] || tagPrincipal;
    const beneficioTexto = textoSeguro(beneficio).trim().toLowerCase();
    const primeiraLocacao = possuiAlgum([
        "primeira locacao",
        "primeiro aluguel",
        "imovel novo",
        "novo e pronto"
    ]);
    const condominioCompleto = possuiAlgum([
        "condominio completo",
        "condominio fechado",
        "infraestrutura completa",
        "lazer completo"
    ]);
    const mobiliado =
        imovel?.caracteristicas?.mobiliado === true ||
        possuiAlgum(["mobiliado", "moveis planejados", "armarios planejados"]);

    if (primeiraLocacao) {
        return "Im&oacute;vel em primeira loca&ccedil;&atilde;o, perfeito para quem deseja um espa&ccedil;o novo e pronto para morar.";
    }

    if (condominioCompleto) {
        return `Ideal para quem busca conforto e praticidade em um condom&iacute;nio completo${bairroTexto}.`;
    }

    if (mobiliado) {
        return `Pronto para morar, com detalhes que tornam a rotina mais pr&aacute;tica e acolhedora${regiaoTexto}.`;
    }

    if (beneficioTexto) {
        return finalidade === "aluguel"
            ? `Perfeito para morar com tranquilidade, reunindo ${beneficioTexto} e praticidade no dia a dia.`
            : `Im&oacute;vel que re&uacute;ne ${beneficioTexto}, conforto e excelente potencial de valoriza&ccedil;&atilde;o.`;
    }

    if (perfil.includes("invest") || imovel?.classificacao?.investimento === true) {
        return "Im&oacute;vel com perfil vers&aacute;til, pensado para quem valoriza seguran&ccedil;a e bom potencial de retorno.";
    }

    if (padrao) {
        return `Uma escolha de padr&atilde;o ${padrao.toLowerCase()}, com conforto e boa leitura de valor para o futuro morador.`;
    }

    if (bairro) {
        return finalidade === "aluguel"
            ? `Perfeito para viver com tranquilidade em uma localiza&ccedil;&atilde;o agrad&aacute;vel${regiaoTexto}.`
            : `Excelente oportunidade para quem busca qualidade de vida e &oacute;tima localiza&ccedil;&atilde;o${regiaoTexto}.`;
    }

    return "Im&oacute;vel com atributos bem equilibrados para quem valoriza conforto, praticidade e uma boa experi&ecirc;ncia de moradia.";
}

function pontuarImovelRelacionado(imovelBase, candidato) {
    let pontuacao = 0;

    if (
        valoresIguais(
            localizacaoImovel(imovelBase, "bairro"),
            localizacaoImovel(candidato, "bairro")
        )
    ) {
        pontuacao += 5;
    }

    if (valoresIguais(imovelBase?.finalidade, candidato?.finalidade)) {
        pontuacao += 4;
    }

    if (valoresIguais(imovelBase?.tipo, candidato?.tipo)) {
        pontuacao += 3;
    }

    if (precoSemelhante(imovelBase, candidato)) {
        pontuacao += 3;
    }

    if (
        valoresIguais(
            classificacaoImovel(imovelBase, "padrao"),
            classificacaoImovel(candidato, "padrao")
        )
    ) {
        pontuacao += 2;
    }

    if (
        valoresIguais(
            classificacaoImovel(imovelBase, "perfil"),
            classificacaoImovel(candidato, "perfil")
        )
    ) {
        pontuacao += 2;
    }

    if (
        valoresProximos(
            caracteristicaNumerica(imovelBase, "quartos"),
            caracteristicaNumerica(candidato, "quartos")
        )
    ) {
        pontuacao += 2;
    }

    if (valoresIguais(condominioImovel(imovelBase), condominioImovel(candidato))) {
        pontuacao += 2;
    }

    if (
        valoresProximos(
            caracteristicaNumerica(imovelBase, "banheiros"),
            caracteristicaNumerica(candidato, "banheiros")
        )
    ) {
        pontuacao += 1;
    }

    if (
        valoresProximos(
            caracteristicaNumerica(imovelBase, "vagas"),
            caracteristicaNumerica(candidato, "vagas")
        )
    ) {
        pontuacao += 1;
    }

    return pontuacao;
}

function selecionarImoveisRelacionados(imovelBase, lista) {
    return arraySeguro(lista)
        .filter(item =>
            item &&
            !mesmoImovel(imovelBase, item) &&
            valoresIguais(item.finalidade, imovelBase.finalidade)
        )
        .map(item => ({
            imovel: item,
            pontuacao: pontuarImovelRelacionado(imovelBase, item),
            diferencaPreco: diferencaPreco(imovelBase, item)
        }))
        .sort((a, b) => {
            if (b.pontuacao !== a.pontuacao) {
                return b.pontuacao - a.pontuacao;
            }

            if (Boolean(b.imovel?.destaque) !== Boolean(a.imovel?.destaque)) {
                return Number(Boolean(b.imovel?.destaque)) - Number(Boolean(a.imovel?.destaque));
            }

            if (ordemImovel(a.imovel) !== ordemImovel(b.imovel)) {
                return ordemImovel(a.imovel) - ordemImovel(b.imovel);
            }

            return a.diferencaPreco - b.diferencaPreco;
        })
        .map(item => item.imovel);
}

function urlCanonicaImovel(slug) {
    return `${CONFIG.SITE_URL}/${urlImovel(slug)}`;
}

function imagemAbsoluta(caminho) {
    const imagem = textoSeguro(caminho) || CONFIG.IMAGE_FALLBACK;

    return `${CONFIG.SITE_URL}/${imagem.replace(/^\.?\//, "")}`;
}

function upsertMeta(seletor, atributo, valorAtributo, content) {
    let meta = document.querySelector(seletor);

    if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(atributo, valorAtributo);
        document.head.appendChild(meta);
    }

    meta.setAttribute("content", content);
}

function upsertLink(seletor, rel, href) {
    let link = document.querySelector(seletor);

    if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", rel);
        document.head.appendChild(link);
    }

    link.setAttribute("href", href);
}

function normalizarEspacos(texto) {
    return textoSeguro(texto).replace(/\s+/g, " ").trim();
}

function limitarMetaDescription(texto) {
    let descricao = normalizarEspacos(texto);

    if (descricao.length < 140) {
        descricao = normalizarEspacos(
            `${descricao} Veja detalhes, fotos, localizacao e informacoes para agendar sua visita com atendimento especializado.`
        );
    }

    if (descricao.length <= 160) {
        return descricao;
    }

    const limite = descricao.slice(0, 157);
    const ultimoEspaco = limite.lastIndexOf(" ");

    return `${limite.slice(0, ultimoEspaco > 120 ? ultimoEspaco : 157).trim()}...`;
}

function gerarMetaDescriptionImovel(imovel, contexto) {
    const quartos = numeroSeguro(imovel?.caracteristicas?.quartos);
    const tipo = textoSeguro(imovel?.tipo).trim() || "Imovel";
    const bairro = textoSeguro(contexto.bairro).trim();
    const cidade = textoSeguro(contexto.cidade).trim() || CONFIG.CIDADE_PADRAO;
    const estado = textoSeguro(contexto.estado).trim() || CONFIG.ESTADO_PADRAO;
    const finalidade = textoSeguro(imovel?.finalidade).trim().toLowerCase();
    const dormitorios =
        quartos > 0
            ? ` com ${quartos} ${quartos === 1 ? "quarto" : "quartos"}`
            : "";
    const localizacao =
        bairro
            ? `${bairro}, ${cidade}/${estado}`
            : `${cidade}/${estado}`;

    return limitarMetaDescription(
        `${tipo}${dormitorios} ${finalidade ? `para ${finalidade} ` : ""}em ${localizacao}. Confira fotos, caracteristicas, valor e detalhes deste imovel.`
    );
}

function objetoComValores(dados) {
    return Object.fromEntries(
        Object.entries(dados).filter(([, valor]) => {
            if (valor === undefined || valor === null) return false;
            if (typeof valor === "string" && valor.trim() === "") return false;
            if (Array.isArray(valor) && valor.length === 0) return false;
            return true;
        })
    );
}

function aplicarSeoImovel(imovel, contexto) {
    const seoTitle = `${contexto.titulo} | ${CONFIG.SITE_NAME}`;
    const metaDescription = gerarMetaDescriptionImovel(imovel, contexto);
    const canonicalSeo =
        textoSeguro(imovel?.seo?.canonical).trim() ||
        contexto.urlAtual;
    const imagemCompartilhamento =
        textoSeguro(imovel?.seo?.ogImage).trim() ||
        contexto.imagemCompartilhamento;
    const latitudeTexto = textoSeguro(imovel?.localizacao?.latitude).trim();
    const longitudeTexto = textoSeguro(imovel?.localizacao?.longitude).trim();
    const latitude = Number(latitudeTexto);
    const longitude = Number(longitudeTexto);
    const possuiCoordenadas =
        latitudeTexto !== "" &&
        longitudeTexto !== "" &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude);
    const endereco = imovel?.endereco || {};
    const possuiEndereco =
        Boolean(
            textoSeguro(endereco.logradouro).trim() ||
            textoSeguro(endereco.numero).trim() ||
            textoSeguro(endereco.cep).trim() ||
            textoSeguro(contexto.bairro).trim() ||
            textoSeguro(contexto.cidade).trim() ||
            textoSeguro(contexto.estado).trim()
        );
    const postalAddress = possuiEndereco
        ? objetoComValores({
            "@type": "PostalAddress",
            "streetAddress": normalizarEspacos(
                `${textoSeguro(endereco.logradouro)} ${textoSeguro(endereco.numero)}`
            ),
            "addressLocality": contexto.cidade,
            "addressRegion": contexto.estado,
            "postalCode": textoSeguro(endereco.cep),
            "addressCountry": "BR",
            "addressNeighborhood": contexto.bairro
        })
        : undefined;
    const residence = objetoComValores({
        "@type": "Residence",
        "@id": `${contexto.urlAtual}#residence`,
        "name": contexto.titulo,
        "description": metaDescription,
        "address": postalAddress,
        "geo": possuiCoordenadas
            ? {
                "@type": "GeoCoordinates",
                "latitude": latitude,
                "longitude": longitude
            }
            : undefined,
        "numberOfRooms": numeroSeguro(imovel?.caracteristicas?.quartos) || undefined,
        "numberOfBathroomsTotal": numeroSeguro(imovel?.caracteristicas?.banheiros) || undefined,
        "floorSize": numeroSeguro(imovel?.metragem?.areaConstruida) > 0
            ? {
                "@type": "QuantitativeValue",
                "value": numeroSeguro(imovel?.metragem?.areaConstruida),
                "unitCode": "MTK"
            }
            : undefined
    });
    const offer = objetoComValores({
        "@type": "Offer",
        "price": numeroSeguro(imovel?.preco?.valor) || undefined,
        "priceCurrency": imovel?.preco?.moeda || CONFIG.MOEDA,
        "url": contexto.urlAtual,
        "availability":
            textoSeguro(imovel?.status).toLowerCase() === "vendido" ||
            textoSeguro(imovel?.status).toLowerCase() === "alugado"
                ? "https://schema.org/SoldOut"
                : "https://schema.org/InStock"
    });
    const schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": CONFIG.SITE_URL
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "Im\u00f3veis",
                        "item": `${CONFIG.SITE_URL}/`
                    },
                    {
                        "@type": "ListItem",
                        "position": 3,
                        "name": contexto.titulo,
                        "item": contexto.urlAtual
                    }
                ]
            },
            {
                "@type": "RealEstateListing",
                "@id": `${contexto.urlAtual}#listing`,
                "name": contexto.titulo,
                "description": metaDescription,
                "url": contexto.urlAtual,
                "identifier": textoSeguro(imovel?.codigo),
                "image": [imagemCompartilhamento],
                "mainEntity": {
                    "@id": `${contexto.urlAtual}#residence`
                },
                "offers": offer
            },
            residence
        ]
    };

    document.title = seoTitle;

    upsertMeta('meta[name="description"]', "name", "description", metaDescription);
    upsertMeta('meta[name="robots"]', "name", "robots", "index, follow");
    upsertMeta('meta[property="og:type"]', "property", "og:type", "website");
    upsertMeta('meta[property="og:title"]', "property", "og:title", seoTitle);
    upsertMeta('meta[property="og:description"]', "property", "og:description", metaDescription);
    upsertMeta('meta[property="og:image"]', "property", "og:image", imagemCompartilhamento);
    upsertMeta('meta[property="og:url"]', "property", "og:url", contexto.urlAtual);
    upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", seoTitle);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", metaDescription);
    upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", imagemCompartilhamento);
    upsertLink('link[rel="canonical"]', "canonical", canonicalSeo);

    document.getElementById("breadcrumb-schema")?.remove();
    document.getElementById("listing-schema")?.remove();

    let schemaScript = document.getElementById("imovel-schema");

    if (!schemaScript) {
        schemaScript = document.createElement("script");
        schemaScript.type = "application/ld+json";
        schemaScript.id = "imovel-schema";
        document.head.appendChild(schemaScript);
    }

    schemaScript.textContent = JSON.stringify(schema);

    return metaDescription;
}

function mostrarToastCompartilhamento(mensagem) {
    const toastExistente =
        document.querySelector(".compartilhar-toast");

    if (toastExistente) {
        toastExistente.remove();
    }

    const toast = document.createElement("div");
    toast.className = "compartilhar-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.textContent = mensagem;

    document.body.appendChild(toast);

    window.setTimeout(() => {
        toast.classList.add("compartilhar-toast-visivel");
    }, 10);

    window.setTimeout(() => {
        toast.classList.remove("compartilhar-toast-visivel");

        window.setTimeout(() => {
            toast.remove();
        }, 250);
    }, 2000);
}

/* =========================================================
   CARREGAR IMÓVEIS
========================================================= */

export async function carregarImoveis() {

    try {

        if (imoveisCache.length > 0) {
            return imoveisCache;
        }

        const response = await fetch(CONFIG.API_URL);

        if (!response.ok) {
            throw new Error("Erro ao carregar imóveis");
        }

        const data = await response.json();

        if (!data || !Array.isArray(data.imoveis)) {
            throw new Error("Estrutura JSON inválida");
        }

        const imoveisNormalizados = normalizarLista(data.imoveis);

        validarLista(imoveisNormalizados);

        const imoveisComIndiceBusca = imoveisNormalizados.map(imovel => ({
            ...imovel,
            indiceBusca: gerarIndiceBusca(imovel),
            scoreQualidade: calcularScoreQualidade(imovel)
        }));

        imoveisCache = ordenarImoveis(
            imoveisComIndiceBusca.filter(
                item => item && item.sistema?.publicado !== false
            )
        );

        return imoveisCache;

    } catch (error) {

        console.error("[IMOVEIS]", error);
        return [];

    }
}

/* =========================================================
   BUSCAR IMÓVEL POR SLUG
========================================================= */

export async function buscarImovelPorSlug(slug) {

    if (!slug) return null;

    const imoveis = await carregarImoveis();

    return imoveis.find(
        imovel => textoSeguro(imovel.slug) === textoSeguro(slug)
    ) || null;
}

/* =========================================================
   BUSCAR IMÓVEL POR ID
========================================================= */

export async function buscarImovelPorId(id) {

    if (!id) return null;

    const imoveis = await carregarImoveis();

    return imoveis.find(
        imovel => textoSeguro(imovel.id) === textoSeguro(id)
    ) || null;
}

/* =========================================================
   OBTER DESTAQUES
========================================================= */

export async function obterDestaques() {

    const imoveis = await carregarImoveis();

    return imoveis.filter(imovel => imovel.destaque === true);
}

/* =========================================================
   RENDERIZAR DESTAQUES HOME
========================================================= */

export async function renderizarDestaquesHome() {

    const container = document.getElementById("imoveis-destaque-home");

    if (!container) return;

    const destaques = await obterDestaques();

    if (destaques.length === 0) {
        container.innerHTML = `<p class="sem-imoveis">Nenhum imóvel em destaque.</p>`;
        return;
    }

    container.innerHTML = destaques
        .slice(0, 6)
        .map(imovel => criarCard(imovel))
        .join("");
}

/* =========================================================
   OBTER IMÓVEIS POR FINALIDADE
========================================================= */

export async function obterPorFinalidade(finalidade) {

    const imoveis = await carregarImoveis();

    return imoveis.filter(
        item =>
            textoSeguro(item.finalidade).toLowerCase() ===
            textoSeguro(finalidade).toLowerCase()
    );
}

/* =========================================================
   RENDERIZAR IMÓVEIS VENDA
========================================================= */

export async function renderizarImoveisVenda() {

    const container = document.getElementById("lista-imoveis");

    if (!container) return;

    const todosImoveis = await carregarImoveis();

    const venda = todosImoveis.filter(
        item => item.finalidade?.toLowerCase() === "venda"
    );

    /* -------------------------------------------------
       POPULAR FILTRO DE BAIRROS
    ------------------------------------------------- */

    const filtroBairro = document.getElementById("filtro-bairro");

    if (filtroBairro) {

        const bairros = [
            ...new Set(venda.map(item => item.bairro).filter(Boolean))
        ].sort();

        filtroBairro.innerHTML = `<option value="">Todos os bairros</option>`;

        bairros.forEach(bairro => {
            filtroBairro.innerHTML += `<option value="${bairro}">${bairro}</option>`;
        });
    }

    /* -------------------------------------------------
       ATUALIZAR LISTA
    ------------------------------------------------- */

    function atualizarLista() {

        let resultado = [...venda];

        const bairro    = document.getElementById("filtro-bairro")?.value  || "";
        const quartos   = document.getElementById("filtro-quartos")?.value || "";
        const preco     = document.getElementById("filtro-preco")?.value   || "";
        const ordenacao = document.getElementById("ordenacao")?.value      || "";

        resultado = filtrarPorBairro(resultado, bairro);
        resultado = filtrarPorQuartos(resultado, quartos);
        resultado = filtrarPorPreco(resultado, preco);
        resultado = ordenarImoveisPorFiltro(resultado, ordenacao);

        if (resultado.length === 0) {
            container.innerHTML = `<p class="sem-imoveis">Nenhum imóvel encontrado.</p>`;
            return;
        }

        container.innerHTML = resultado.map(imovel => criarCard(imovel)).join("");
    }

    atualizarLista();

    document.getElementById("filtro-bairro")?.addEventListener("change", atualizarLista);
    document.getElementById("filtro-quartos")?.addEventListener("change", atualizarLista);
    document.getElementById("filtro-preco")?.addEventListener("change", atualizarLista);
    document.getElementById("ordenacao")?.addEventListener("change", atualizarLista);

    document.getElementById("limpar-filtros")?.addEventListener("click", () => {
        document.getElementById("filtro-bairro").value = "";
        document.getElementById("filtro-quartos").value = "";
        document.getElementById("filtro-preco").value = "";
        document.getElementById("ordenacao").value = "";

        atualizarLista();
    });
}

/* =========================================================
   RENDERIZAR IMÓVEIS ALUGUEL
========================================================= */

export async function renderizarImoveisAluguel() {

    const container = document.getElementById("lista-imoveis-aluguel");

    if (!container) return;

    const todosImoveis = await carregarImoveis();

    const aluguel = todosImoveis.filter(
        item => item.finalidade?.toLowerCase() === "aluguel"
    );

    /* -------------------------------------------------
       POPULAR FILTRO DE BAIRROS
    ------------------------------------------------- */

    const filtroBairro = document.getElementById("filtro-bairro");

    if (filtroBairro) {

        const bairros = [
            ...new Set(aluguel.map(item => item.bairro).filter(Boolean))
        ].sort();

        filtroBairro.innerHTML = `<option value="">Todos os bairros</option>`;

        bairros.forEach(bairro => {
            filtroBairro.innerHTML += `<option value="${bairro}">${bairro}</option>`;
        });
    }

    /* -------------------------------------------------
       ATUALIZAR LISTA
    ------------------------------------------------- */

    function atualizarLista() {

        let resultado = [...aluguel];

        const bairro    = document.getElementById("filtro-bairro")?.value  || "";
        const quartos   = document.getElementById("filtro-quartos")?.value || "";
        const preco     = document.getElementById("filtro-preco")?.value   || "";
        const ordenacao = document.getElementById("ordenacao")?.value      || "";

        resultado = filtrarPorBairro(resultado, bairro);
        resultado = filtrarPorQuartos(resultado, quartos);
        resultado = filtrarPorPreco(resultado, preco);
        resultado = ordenarImoveisPorFiltro(resultado, ordenacao);

        if (resultado.length === 0) {
            container.innerHTML = `<p class="sem-imoveis">Nenhum imóvel encontrado.</p>`;
            return;
        }

        container.innerHTML = resultado.map(imovel => criarCard(imovel)).join("");
    }

    atualizarLista();

    document.getElementById("filtro-bairro")?.addEventListener("change", atualizarLista);
    document.getElementById("filtro-quartos")?.addEventListener("change", atualizarLista);
    document.getElementById("filtro-preco")?.addEventListener("change", atualizarLista);
    document.getElementById("ordenacao")?.addEventListener("change", atualizarLista);

    document.getElementById("limpar-filtros")?.addEventListener("click", () => {
        document.getElementById("filtro-bairro").value = "";
        document.getElementById("filtro-quartos").value = "";
        document.getElementById("filtro-preco").value = "";
        document.getElementById("ordenacao").value = "";

        atualizarLista();
    });

} // ← CHAVE QUE ESTAVA FALTANDO — fecha renderizarImoveisAluguel

/* =========================================================
   RENDERIZAR PÁGINA DO IMÓVEL
========================================================= */

export async function renderizarPaginaImovel() {

    /* -------------------------------------------------
       PEGAR SLUG DA URL
    ------------------------------------------------- */

    const params = new URLSearchParams(window.location.search);
    const slug   = params.get("slug");

    if (!slug) return;

    /* -------------------------------------------------
       BUSCAR IMÓVEL
    ------------------------------------------------- */

    const imovel = await buscarImovelPorSlug(slug);

    if (!imovel) {
        console.error("Imóvel não encontrado");
        return;
    }

    registrarHistorico(imovel);

    /* -------------------------------------------------
       ELEMENTOS
    ------------------------------------------------- */

    const galeria = document.getElementById("imovel-galeria");
    const info    = document.getElementById("imovel-info");
    const conteudo = document.getElementById("imovel-conteudo");

    if (!galeria || !info) return;

    inicializarGaleria(galeria, imovel);

    /* -------------------------------------------------
       PREÇO E DADOS PRINCIPAIS
    ------------------------------------------------- */

    const preco  = formatarPreco(imovel.preco?.valor);
    const statusNormalizado =
        textoSeguro(imovel.status).toLowerCase();
    const imovelAlugado =
        statusNormalizado === "alugado";

    const bairro = imovel.localizacao?.bairro || imovel.bairro || "";
    const cidade = imovel.localizacao?.cidade || imovel.cidade || "";
    const estado = imovel.localizacao?.estado || imovel.estado || "";

    const whatsapp = imovel.contato?.whatsapp || CONFIG.WHATSAPP;
    const urlAtual = urlCanonicaImovel(imovel.slug);
    const titulo   = textoSeguro(imovel.titulo).trim() || "Imovel";
    const mensagemContato =
        `Olá Stephanie, tenho interesse neste imóvel: ${titulo}\n\n${urlAtual}`;

    const imagemCompartilhamento = imagemAbsoluta(
        imovel.midia?.thumbnail   ||
        imovel.midia?.galeria?.[0] ||
        CONFIG.IMAGE_FALLBACK
    );

    /* -------------------------------------------------
       DIFERENCIAIS
    ------------------------------------------------- */

    const diferenciaisGenericos = new Set([
        "cozinha",
        "sala",
        "banheiro",
        "quarto",
        "quartos",
        "área de serviço",
        "area de servico"
    ]);

    const diferenciaisFortes = arraySeguro(imovel.diferenciais)
        .filter(item =>
            !diferenciaisGenericos.has(
                textoSeguro(item).trim().toLowerCase()
            )
        );

    const diferenciais = diferenciaisFortes
    .map(item => `
        <div class="diferencial-chip">
            <i class="fa-solid fa-check"></i>
            <span>${item}</span>
        </div>
    `)
    .join("");

    const resumoEstrategico = gerarResumoEstrategico(imovel);
    const resumoEstrategicoHtml = resumoEstrategico
        ? `<p class="resumo-estrategico-imovel">${resumoEstrategico}</p>`
        : "";

    /* -------------------------------------------------
       DESCRIÇÃO
    ------------------------------------------------- */

    const descricao = (imovel.descricao?.completa || [])
    .map((texto,index) => `

        <div class="descricao-bloco ${index === 0 ? 'descricao-principal' : ''}">

            ${destacarDescricao(texto)}

        </div>

    `)
    .join("");

    const descricaoHighlight = diferenciaisFortes
    .slice(0, 3)
    .map(item => `
        <span>
            <i class="fa-solid fa-check"></i>
            ${item}
        </span>
    `)
    .join("");

    /* -------------------------------------------------
       CARACTERÍSTICAS
    ------------------------------------------------- */

    const caracteristicas = `
        <div class="imovel-caracteristicas">

            ${imovel.caracteristicas?.quartos > 0 ? `
                <div class="caracteristica-item">
                    <i class="fa-solid fa-bed"></i>
                    ${imovel.caracteristicas.quartos} Quartos
                </div>` : ""}

            ${imovel.caracteristicas?.banheiros > 0 ? `
                <div class="caracteristica-item">
                    <i class="fa-solid fa-bath"></i>
                    ${imovel.caracteristicas.banheiros} Banheiros
                </div>` : ""}

            ${imovel.caracteristicas?.vagas > 0 ? `
                <div class="caracteristica-item">
                    <i class="fa-solid fa-car"></i>
                    ${imovel.caracteristicas.vagas} Vagas
                </div>` : ""}

            ${imovel.caracteristicas?.suites > 0 ? `
                <div class="caracteristica-item">
                    <i class="fa-solid fa-star"></i>
                    ${imovel.caracteristicas.suites} Suíte(s)
                </div>` : ""}

            ${imovel.metragem?.areaConstruida > 0 ? `
                <div class="caracteristica-item">
                    <i class="fa-solid fa-ruler-combined"></i>
                    ${imovel.metragem.areaConstruida} m² Construídos
                </div>` : ""}

            ${imovel.metragem?.areaTerreno > 0 ? `
                <div class="caracteristica-item">
                    <i class="fa-solid fa-tree"></i>
                    ${imovel.metragem.areaTerreno} m² Terreno
                </div>` : ""}

        </div>
    `;

    /* -------------------------------------------------
       FICHA TECNICA
    ------------------------------------------------- */

    const itensFicha = [];

    const adicionarItemFicha = (rotulo, valor, icone) => {
        const valorTexto = typeof valor === "number" ? String(valor) : textoSeguro(valor).trim();

        if (valorTexto === "" || valorTexto === "0") return;

        itensFicha.push({ rotulo, valor: valorTexto, icone });
    };

    const adicionarNumeroFicha = (rotulo, valor, icone) => {
        const numero = numeroSeguro(valor);

        if (numero <= 0) return;

        adicionarItemFicha(rotulo, numero, icone);
    };

    const adicionarValorFicha = (rotulo, valor, icone) => {
        const numero = numeroSeguro(valor);

        if (numero <= 0) return;

        adicionarItemFicha(rotulo, formatarPreco(numero), icone);
    };

    const adicionarBooleanoFicha = (rotulo, valor, icone) => {
        if (valor !== true) return;

        adicionarItemFicha(rotulo, "Sim", icone);
    };

    adicionarItemFicha("Tipo", imovel.tipo, "fa-house");
    adicionarItemFicha("Categoria", imovel.categoria, "fa-layer-group");
    adicionarItemFicha("Finalidade", imovel.finalidade, "fa-key");
    adicionarItemFicha(
        "Status",
        (imovel.status || "").replace("disponivel", "Dispon&iacute;vel"),
        "fa-circle-check"
    );
    adicionarValorFicha("Condom&iacute;nio", imovel.preco?.condominio, "fa-building");
    adicionarValorFicha("IPTU", imovel.preco?.iptu, "fa-file-invoice-dollar");

    adicionarNumeroFicha("Salas", imovel.caracteristicas?.salas, "fa-couch");
    adicionarNumeroFicha("Andares", imovel.caracteristicas?.andares, "fa-stairs");
    adicionarBooleanoFicha("Aceita pet", imovel.caracteristicas?.aceitaPet, "fa-paw");
    adicionarBooleanoFicha("Mobiliado", imovel.caracteristicas?.mobiliado, "fa-chair");

    adicionarItemFicha("Tipo de constru&ccedil;&atilde;o", imovel.classificacao?.tipoConstrucao, "fa-helmet-safety");
    adicionarItemFicha("Padr&atilde;o", imovel.classificacao?.padrao, "fa-gem");
    adicionarItemFicha("Perfil", imovel.classificacao?.perfil, "fa-user-check");
    adicionarBooleanoFicha("Aceita financiamento", imovel.classificacao?.aceitaFinanciamento, "fa-landmark");
    adicionarBooleanoFicha("Investimento", imovel.classificacao?.investimento, "fa-chart-line");

    const comodidadesFicha = arraySeguro(imovel.comodidades)
        .map(item => textoSeguro(item).trim())
        .filter(Boolean);
    const metadeFicha = Math.ceil(itensFicha.length / 2);
    const colunasFicha = [
        itensFicha.slice(0, metadeFicha),
        itensFicha.slice(metadeFicha)
    ].filter(coluna => coluna.length > 0);

    const fichaTecnica = itensFicha.length > 0 || comodidadesFicha.length > 0
        ? `
            <section class="bloco-imovel ficha-tecnica-imovel">
                <h2 class="section-title-imovel">Ficha t&eacute;cnica</h2>

                ${itensFicha.length > 0 ? `
                    <div class="ficha-tecnica-lista ${colunasFicha.length === 1 ? "ficha-tecnica-lista-uma-coluna" : ""}">
                        ${colunasFicha.map(coluna => `
                            <div class="ficha-tecnica-coluna">
                                ${coluna.map(item => `
                                    <div class="ficha-tecnica-item">
                                        <i class="fa-solid ${item.icone}"></i>
                                        <span>${item.rotulo}</span>
                                        <strong>${item.valor}</strong>
                                    </div>
                                `).join("")}
                            </div>
                        `).join("")}
                    </div>
                ` : ""}

                ${comodidadesFicha.length > 0 ? `
                    <div class="ficha-comodidades">
                        <h3>Comodidades</h3>

                        <div class="ficha-comodidades-lista">
                            ${comodidadesFicha.map(item => `
                                <span>
                                    <i class="fa-solid fa-check"></i>
                                    ${item}
                                </span>
                            `).join("")}
                        </div>
                    </div>
                ` : ""}
            </section>
        `
        : "";

    /* -------------------------------------------------
       BREADCRUMB
    ------------------------------------------------- */

    const breadcrumb = document.getElementById("breadcrumb");

    if (breadcrumb) {

        const paginaFinalidade =
    imovel.finalidade?.toLowerCase() === "aluguel"
        ? "aluguel.html"
        : "comprar.html";
        breadcrumb.innerHTML = `
    <a href="index.html">Início</a>

    <span>/</span>

    <a href="${paginaFinalidade}">
        ${imovel.finalidade}
    </a>

    <span>/</span>

    <span>
        ${imovel.titulo}
    </span>
`;
    }

    /* -------------------------------------------------
       INFO
    ------------------------------------------------- */

   info.innerHTML = `

    <span class="imovel-tag">
        ${imovel.finalidade || ""}
    </span>

    <h1>
        ${titulo}
    </h1>

    <h2>
        ${preco}
    </h2>

    ${imovelAlugado ? `
    <div class="aviso-imovel-alugado">

        <strong>
            Este im&oacute;vel j&aacute; foi alugado.
        </strong>

        <p>
            Mas temos outros im&oacute;veis semelhantes dispon&iacute;veis para loca&ccedil;&atilde;o.
        </p>

        <a href="aluguel.html">
            Ver outros im&oacute;veis
        </a>

    </div>
    ` : ""}

    <div class="imovel-localizacao">
        <i class="fa-solid fa-location-dot"></i>
        <span>
            ${bairro}, ${cidade} - ${estado}
        </span>
    </div>

   <div class="imovel-meta">

    <div class="imovel-codigo">

        <span>
            C&oacute;digo:
        </span>

        <strong>
            ${imovel.codigo || "N/D"}
        </strong>

    </div>

    <div class="imovel-badges">

        ${imovel.tagPrincipal ? `

        <div class="imovel-tag-principal">

            ${imovel.tagPrincipal}

        </div>

        ` : ""}

        <div class="imovel-status">

            <span
            class="status-badge status-${(imovel.status || "").toLowerCase()}">

                ${(imovel.status || "Disponivel")
                    .replace("Disponivel", "Disponível")}

            </span>

        </div>

    </div>

</div>

    ${imovelAlugado ? `
    <button
        class="imovel-whatsapp-principal imovel-whatsapp-indisponivel"
        type="button"
        disabled>

        <i class="fa-solid fa-check"></i>

        <span>
            Este im&oacute;vel j&aacute; foi alugado
        </span>

    </button>
    ` : `
    <a
        class="imovel-whatsapp-principal"
        target="_blank"
        rel="noopener noreferrer"
        href="https://wa.me/${whatsapp}?text=${encodeURIComponent(mensagemContato)}">

        <i class="fab fa-whatsapp"></i>

        <span>
            Falar no WhatsApp
        </span>

    </a>
    `}


    <div class="imovel-compartilhar">

        <h3>
            Compartilhar imóvel
        </h3>

        <div class="compartilhar-botoes">

            <button
            id="compartilhar-whatsapp"
            class="btn-compartilhar"
            type="button"
            aria-label="Compartilhar im&oacute;vel pelo WhatsApp"
            title="Compartilhar im&oacute;vel pelo WhatsApp">

                <i class="fab fa-whatsapp"></i>

                WhatsApp

            </button>

            <button
            id="compartilhar-facebook"
            class="btn-compartilhar"
            type="button"
            aria-label="Compartilhar im&oacute;vel no Facebook"
            title="Compartilhar im&oacute;vel no Facebook">

                <i class="fab fa-facebook-f"></i>

                Facebook

            </button>

            <button
            id="copiar-link"
            class="btn-compartilhar"
            type="button"
            aria-label="Copiar link do im&oacute;vel"
            title="Copiar link do im&oacute;vel">

                <i class="fa-solid fa-link"></i>

                Copiar Link

            </button>

        </div>

    </div>

`;

conteudo.innerHTML = `
<section class="bloco-imovel bloco-caracteristicas-imovel">

    <h2 class="section-title-imovel">Características</h2>

    ${caracteristicas}

</section>

${fichaTecnica}

<section class="bloco-imovel bloco-descricao-imovel">

    <h2 class="section-title-imovel">Descrição do imóvel</h2>

    ${resumoEstrategicoHtml}

    <div class="descricao-highlight">

        ${descricaoHighlight}

    </div>

    <div class="descricao-imovel">

        ${descricao}

    </div>

</section>

<section class="bloco-imovel">

    <h2 class="section-title-imovel">Diferenciais</h2>

    <div class="lista-diferenciais">

    ${diferenciais}

    </div>

</section>
`;

    /* -------------------------------------------------
       IMÓVEIS RELACIONADOS
    ------------------------------------------------- */

    const containerRelacionados = document.getElementById("imoveis-relacionados");

    if (containerRelacionados) {

        const todosImoveis = await carregarImoveis();

        const relacionados = selecionarImoveisRelacionados(imovel, todosImoveis)
            .slice(0, 3);

        if (relacionados.length > 0) {

            containerRelacionados.innerHTML = `
                <h2 class="titulo-relacionados section-title-imovel">Você também pode gostar</h2>
                <div class="relacionados-grid">
                    ${relacionados.map(item => {

                        const imagem =
                            item.midia?.thumbnail   ||
                            item.midia?.galeria?.[0] ||
                            CONFIG.IMAGE_FALLBACK;

                        const precoRelacionado    = formatarPreco(item.preco?.valor);
                        const bairroRelacionado   = item.localizacao?.bairro || item.bairro || "";
                        const cidadeRelacionada   = item.localizacao?.cidade || item.cidade || "";

                        return `
                            <article class="relacionado-card">
                                <img
                                    src="${imagem}"
                                    alt="${item.titulo}"
                                    title="${item.titulo}"
                                    loading="lazy"
                                    decoding="async">
                                <div class="relacionado-content">
                                    <h3>${item.titulo}</h3>
                                    <div class="relacionado-local">
                                        ${bairroRelacionado}${cidadeRelacionada ? ` - ${cidadeRelacionada}` : ""}
                                    </div>
                                    <div class="relacionado-preco">${precoRelacionado}</div>
                                    <a class="relacionado-btn" href="${urlImovel(item.slug)}">
                                        Ver imóvel
                                    </a>
                                </div>
                            </article>
                        `;

                    }).join("")}
                </div>
            `;
        }

        renderizarNavegacaoImoveis(imovel, todosImoveis);
    }

    /* -------------------------------------------------
   CTA FINAL CORRETORA
------------------------------------------------- */

const ctaFinal =
document.getElementById(
    "cta-corretora-final"
);

if (ctaFinal) {

    ctaFinal.innerHTML = `

        <div class="cta-final-card">

            <img
                src="assets/equipe/stephanie.webp"
                alt="Stephanie Campos"
            >

            <div class="cta-final-content">

                <span>
                    Atendimento Personalizado
                </span>

                <h3>
                    Ainda não encontrou o imóvel ideal?
                </h3>

                <p>
                    Está escolhendo alguém para conduzir uma das decisões mais importantes da sua vida.

                    Meu compromisso é oferecer um atendimento transparente, humano e sem pressão, ajudando você a encontrar o imóvel certo no seu tempo e com total segurança.

                    Cada visita, cada negociação e cada etapa são acompanhadas de perto para que sua experiência seja tranquila do início ao fim.
                </p>

                <a
                    target="_blank"
                    href="https://wa.me/${whatsapp}">

                    Falar no WhatsApp

                </a>

            </div>

        </div>

    `;

}
    /* -------------------------------------------------
       SEO DINAMICO
    ------------------------------------------------- */

    aplicarSeoImovel(
        imovel,
        {
            titulo,
            bairro,
            cidade,
            estado,
            urlAtual,
            imagemCompartilhamento
        }
    );
    /* -------------------------------------------------
       COMPARTILHAMENTO
    ------------------------------------------------- */

    document.getElementById("compartilhar-whatsapp")?.addEventListener("click", () => {
        const valorImovel = numeroSeguro(imovel.preco?.valor);
        const linhaValor =
            valorImovel > 0
                ? `\n\n💰 ${preco}`
                : "";
        const localizacaoCompartilhamento =
            `${cidade || CONFIG.CIDADE_PADRAO}/${estado || CONFIG.ESTADO_PADRAO}`;
        const mensagem =
            `🏡 ${titulo}\n\n` +
            `📍 ${localizacaoCompartilhamento}` +
            `${linhaValor}\n\n` +
            `Confira este im\u00f3vel:\n\n` +
            `${urlAtual}`;

        window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, "_blank");
    });

    document.getElementById("compartilhar-facebook")?.addEventListener("click", () => {
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlAtual)}`,
            "_blank"
        );
    });

    document.getElementById("copiar-link")?.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(urlAtual);
            mostrarToastCompartilhamento("Link copiado com sucesso!");
        } catch (error) {
            console.error(error);
        }
    });

} // ← fecha renderizarPaginaImovel
