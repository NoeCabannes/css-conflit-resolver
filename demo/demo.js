
// JavaScript de la démo
document.addEventListener('DOMContentLoaded', function() {
    console.log('Démo chargée');

    // Gestionnaires pour les boutons
    const buttons = document.querySelectorAll('.button');
    buttons.forEach((btn, index) => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log(`Bouton démo ${index + 1} cliqué`);

            // Animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 100);
        });
    });

    // Sélection spécifique pour les fonctionnalités
    const featureBtn1 = document.getElementById('feature-btn-1');
    const featureBtn2 = document.getElementById('feature-btn-2');

    if (featureBtn1) {
        featureBtn1.onclick = function() {
            alert('Fonctionnalité 1 activée!');

            // Changer dynamiquement une classe
            const container = document.querySelector('.container');
            container.className = container.className + ' active-demo';
        };
    }

    if (featureBtn2) {
        featureBtn2.addEventListener('click', () => {
            const demoBox = document.querySelector('.demo-specific');
            demoBox.style.background = '#27ae60';

            // Utiliser getElementsByClassName
            const cards = document.getElementsByClassName('card');
            for (let card of cards) {
                card.style.borderLeft = '4px solid #27ae60';
            }
        });
    }

    // Animation du header au chargement
    const header = document.querySelector('.header');
    if (header) {
        header.style.opacity = '0.8';
        setTimeout(() => {
            header.style.opacity = '1';
        }, 500);
    }

    // Simuler du jQuery
    // $('.button').hover(function() { ... });
});

// Fonction utilitaire qui utilise querySelector
function highlightElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.classList.add('highlighted');
    }
}

// Usage avec différents sélecteurs
setTimeout(() => {
    highlightElement('.demo-specific');
    highlightElement('#main-content');
}, 2000);
