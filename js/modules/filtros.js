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
