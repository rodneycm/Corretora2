function login() {

    const senha = document.getElementById('senha').value;

    if(senha === 'Stecor26') {

        document.getElementById('painel').style.display = 'block';

    } else {

        alert('Senha incorreta');
    }
}

function adicionarImovel() {

    alert('Para salvar imóveis automaticamente será necessário backend ou Firebase futuramente.');

}