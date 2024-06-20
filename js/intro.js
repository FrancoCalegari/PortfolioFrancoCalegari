let intro = document.querySelector('.intro');
let logoSpan = document.querySelectorAll('.logo-parts');

window.addEventListener('DOMContentLoaded', () => {
    // Verificar si es la primera vez que se carga la página
    let isFirstVisit = localStorage.getItem('isFirstVisit');
    
    if (!isFirstVisit) {
        // Es la primera vez, realizar la animación
        setTimeout(() => {
            logoSpan.forEach((span, index) => {
                setTimeout(() => {
                    span.classList.add('active');
                }, (index + 1) * 100);
            });

            setTimeout(() => {
                logoSpan.forEach((span, index) => {
                    setTimeout(() => {
                        span.classList.remove('active');
                        span.classList.add('fade');
                    }, (index + 1) * 50);
                });
            }, 2000);

            setTimeout(() => {
                intro.style.top = '-100vh';
            }, 2300);

            // Guardar en localStorage que ya se ha hecho la primera visita
            localStorage.setItem('isFirstVisit', 'false');

            // Establecer un temporizador para limpiar localStorage después de 20 segundos
            setTimeout(() => {
                localStorage.removeItem('isFirstVisit');
            }, 20000); // 20000 milisegundos = 20 segundos
        }, 500); // Ajusta el tiempo de espera inicial según tu diseño
    } else {
        // No es la primera vez, ocultar la animación y mostrar la web directamente
        intro.style.display = 'none';
    }
});
