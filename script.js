// LIGHTBOX PREMIUM

const imagens = document.querySelectorAll('.galeria-imovel img');

let imagemAtual = 0;

const lightbox = document.createElement('div');
lightbox.classList.add('lightbox');

lightbox.innerHTML = `
    <span class="lightbox-close">&times;</span>
    <span class="lightbox-prev">&#10094;</span>
    <img src="">
    <span class="lightbox-next">&#10095;</span>
`;

document.body.appendChild(lightbox);

const lightboxImg = lightbox.querySelector('img');

function abrirImagem(index){
    imagemAtual = index;
    lightbox.classList.add('active');
    lightboxImg.src = imagens[index].src;
}

imagens.forEach((img,index)=>{
    img.addEventListener('click',()=>{
        abrirImagem(index);
    });
});

lightbox.querySelector('.lightbox-close').addEventListener('click',()=>{
    lightbox.classList.remove('active');
});

lightbox.querySelector('.lightbox-prev').addEventListener('click',()=>{
    imagemAtual--;

    if(imagemAtual < 0){
        imagemAtual = imagens.length - 1;
    }

    lightboxImg.src = imagens[imagemAtual].src;
});

lightbox.querySelector('.lightbox-next').addEventListener('click',()=>{
    imagemAtual++;

    if(imagemAtual >= imagens.length){
        imagemAtual = 0;
    }

    lightboxImg.src = imagens[imagemAtual].src;
});