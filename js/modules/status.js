const STATUS_CONFIG = {
    disponivel: {
        label: "Disponível",
        shortLabel: "Disponível",
        galleryLabel: "",
        priceLabel: "",
        contactLabel: "",
        className: "disponivel",
        icon: "fa-check",
        unavailable: false
    },
    reservado: {
        label: "Reservado",
        shortLabel: "Reservado",
        galleryLabel: "IMÓVEL RESERVADO",
        priceLabel: "Imóvel reservado",
        contactLabel: "Este imóvel está reservado",
        className: "reservado",
        icon: "fa-clock",
        unavailable: true
    },
    "em-analise": {
        label: "Em análise",
        shortLabel: "Em análise",
        galleryLabel: "IMÓVEL EM ANÁLISE",
        priceLabel: "Em análise",
        contactLabel: "Este imóvel está em análise",
        className: "em-analise",
        icon: "fa-magnifying-glass",
        unavailable: true
    },
    alugado: {
        label: "Alugado",
        shortLabel: "Alugado",
        galleryLabel: "IMÓVEL ALUGADO",
        priceLabel: "Já alugado",
        contactLabel: "Este imóvel já foi alugado",
        noticeTitle: "Este imóvel já foi alugado.",
        noticeText: "Mas temos outros imóveis semelhantes disponíveis para locação.",
        noticeLinkLabel: "Ver outros imóveis",
        noticeHref: "aluguel.html",
        className: "alugado",
        icon: "fa-check",
        unavailable: true
    },
    indisponivel: {
        label: "Indisponível",
        shortLabel: "Indisponível",
        galleryLabel: "IMÓVEL INDISPONÍVEL",
        priceLabel: "Imóvel indisponível",
        contactLabel: "Este imóvel está indisponível",
        className: "indisponivel",
        icon: "fa-ban",
        unavailable: true
    },
    manutencao: {
        label: "Manutenção",
        shortLabel: "Manutenção",
        galleryLabel: "IMÓVEL EM MANUTENÇÃO",
        priceLabel: "Em manutenção",
        contactLabel: "Este imóvel está em manutenção",
        className: "manutencao",
        icon: "fa-screwdriver-wrench",
        unavailable: true
    }
};

function normalizarStatus(valor) {
    return String(valor || "disponivel")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");
}

export function obterStatusConfig(status) {
    const chave = normalizarStatus(status);

    return STATUS_CONFIG[chave] || STATUS_CONFIG.disponivel;
}

export function obterStatusImovel(imovel) {
    return obterStatusConfig(imovel?.status);
}

export function statusIndisponivel(imovel) {
    return obterStatusImovel(imovel).unavailable === true;
}

export function criarStatusBadge(imovel, contexto = "card") {
    const status = obterStatusImovel(imovel);

    if (!status.unavailable) {
        return "";
    }

    const texto =
        contexto === "galeria"
            ? status.galleryLabel
            : status.shortLabel;

    return `
        <span class="status-badge-imovel status-badge-imovel-${status.className} status-badge-imovel-${contexto}">
            <i class="fa-solid ${status.icon}"></i>
            ${texto}
        </span>
    `;
}

export function criarStatusPill(imovel) {
    const status = obterStatusImovel(imovel);

    return `
        <span class="status-badge status-${status.className}">
            ${status.label}
        </span>
    `;
}

export function criarStatusOverlay(imovel, contexto = "card") {
    const status = obterStatusImovel(imovel);

    if (!status.unavailable) {
        return "";
    }

    return `
        <div class="status-overlay-imovel status-overlay-imovel-${contexto}"></div>
    `;
}

export function criarPrecoStatus(imovel, precoFormatado) {
    const status = obterStatusImovel(imovel);

    return status.unavailable
        ? status.priceLabel
        : precoFormatado;
}

export function criarAvisoStatus(imovel) {
    const status = obterStatusImovel(imovel);

    if (!status.unavailable || !status.noticeTitle) {
        return "";
    }

    return `
        <div class="aviso-status-imovel aviso-status-imovel-${status.className}">
            <strong>${status.noticeTitle}</strong>
            <p>${status.noticeText}</p>
            <a href="${status.noticeHref}">
                ${status.noticeLinkLabel}
            </a>
        </div>
    `;
}

export function criarBotaoContatoStatus(imovel, whatsappUrl) {
    const status = obterStatusImovel(imovel);

    if (!status.unavailable) {
        return `
            <a
                class="imovel-whatsapp-principal"
                target="_blank"
                rel="noopener noreferrer"
                href="${whatsappUrl}">

                <i class="fab fa-whatsapp"></i>

                <span>
                    Falar no WhatsApp
                </span>

            </a>
        `;
    }

    return `
        <button
            class="imovel-whatsapp-principal imovel-whatsapp-indisponivel"
            type="button"
            disabled>

            <i class="fa-solid ${status.icon}"></i>

            <span>
                ${status.contactLabel}
            </span>

        </button>
    `;
}

export function criarBotaoCardContatoStatus(imovel, whatsappUrl) {
    const status = obterStatusImovel(imovel);

    if (!status.unavailable) {
        return `
            <a
                class="card-whatsapp-btn"
                href="${whatsappUrl}"
                target="_blank"
                rel="noopener noreferrer">

                <i class="fab fa-whatsapp"></i>

                <span>
                    Falar no WhatsApp
                </span>

            </a>
        `;
    }

    return `
        <button
            class="card-whatsapp-btn card-whatsapp-btn-indisponivel"
            type="button"
            disabled>

            <i class="fa-solid ${status.icon}"></i>

            <span>
                ${status.priceLabel}
            </span>

        </button>
    `;
}
