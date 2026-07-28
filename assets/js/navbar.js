(function() {
    var hero = document.querySelector('.banner');
    var nav = document.getElementById('top-nav');

    function toggleNav() {
        if (!hero || !nav) return;
        var heroBottom = hero.offsetHeight - 100; // trigger slightly before hero is fully gone
        if (window.scrollY > heroBottom) {
            nav.classList.add('visible');
        } else {
            nav.classList.remove('visible');
        }
    }

    // Run on scroll
    window.addEventListener('scroll', toggleNav);
    // Run on load to set initial state
    window.addEventListener('load', toggleNav);
    // Run on resize in case hero height changes
    window.addEventListener('resize', toggleNav);
})();