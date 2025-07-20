
// JavaScript du site principal
document.addEventListener('DOMContentLoaded', function() {
    console.log('Site principal chargé');

    // Gérer les boutons
    const buttons = document.querySelectorAll('.button');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            console.log('Bouton cliqué:', e.target.textContent);
        });
    });

    // Animation du header
    const header = document.querySelector('.header');
    if (header) {
        header.style.opacity = '0';
        setTimeout(() => {
            header.style.transition = 'opacity 0.5s';
            header.style.opacity = '1';
        }, 100);
    }

    // Manipulation de classes
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.classList.add('loaded');
    }

    // jQuery-style selector (si jQuery était utilisé)
    // $('.button').on('click', function() { ... });

    // Sélection par className
    const sidebarElements = document.getElementsByClassName('sidebar');
    for (let sidebar of sidebarElements) {
        sidebar.style.transition = 'all 0.3s ease';
    }
});
