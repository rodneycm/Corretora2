async function carregarImoveis() {

    const container = document.getElementById('lista-imoveis');

    if(!container) return;

    try {

        const resposta = await fetch('data/imoveis.json');

        const imoveis = await resposta.json();

        container.innerHTML = '';

        imoveis.forEach(imovel => {

            const card = document.createElement('div');

            card.classList.add('card-imovel');

            card.innerHTML = `

                <img src="${imovel.imagem}" alt="${imovel.titulo}">

                <div class="card-imovel-content">

                    <span class="tipo">
                        ${imovel.tipo}
                    </span>

                    <h3>
                        ${imovel.titulo}
                    </h3>

                    <p class="bairro">
                        📍 ${imovel.bairro}
                    </p>

                    <p class="descricao">
                        ${imovel.descricao}
                    </p>

                    <div class="card-bottom">

                        <strong>
                            R$ ${imovel.preco.toLocaleString('pt-BR')}
                        </strong>

                        <a href="#">
                            Ver imóvel
                        </a>

                    </div>

                </div>
            `;

            container.appendChild(card);

        });

    } catch(error) {

        console.error('Erro ao carregar imóveis:', error);

    }

}

carregarImoveis();