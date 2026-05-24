let imoveis = [];

async function carregarImoveis() {

    const resposta = await fetch('imóveis.json');

    imoveis = await resposta.json();

    renderizarImoveis(imoveis);
}

function renderizarImoveis(lista) {

    const container = document.getElementById('lista-imoveis');

    container.innerHTML = '';

    lista.forEach(imovel => {

        container.innerHTML += `

        <div class="card">

            <img src="${imovel.imagem}">

            <div class="card-content">

                <h3>${imovel.titulo}</h3>

                <p><strong>Bairro:</strong> ${imovel.bairro}</p>

                <p><strong>Tipo:</strong> ${imovel.tipo}</p>

                <p><strong>Finalidade:</strong> ${imovel.finalidade}</p>

                <p><strong>Preço:</strong> R$ ${imovel.preco}</p>

                <p>${imovel.descricao}</p>

            </div>

        </div>

        `;

    });
}

function filtrarImoveis() {

    const tipo = document.getElementById('tipo').value;
    const bairro = document.getElementById('bairro').value.toLowerCase();
    const precoMin = document.getElementById('precoMin').value;
    const precoMax = document.getElementById('precoMax').value;
    const finalidade = document.getElementById('finalidade').value;

    const filtrados = imoveis.filter(imovel => {

        return (
            (!tipo || imovel.tipo === tipo) &&
            (!bairro || imovel.bairro.toLowerCase().includes(bairro)) &&
            (!precoMin || imovel.preco >= precoMin) &&
            (!precoMax || imovel.preco <= precoMax) &&
            (!finalidade || imovel.finalidade === finalidade)
        );

    });

    renderizarImoveis(filtrados);
}

carregarImoveis();