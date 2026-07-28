(function() {
    var ambientBg = document.getElementById('ambient-bg');
    if (!ambientBg) return;

    var hero = document.querySelector('.banner.fullscreen');
    // Fallback height if hero not found
    var threshold = hero ? hero.offsetHeight : window.innerHeight;

    function toggleAmbient() {
        var scrollY = window.scrollY;
        // Show ambient when scrolled past hero (with a small offset)
        if (scrollY > threshold - 50) {
            ambientBg.classList.add('visible');
        } else {
            ambientBg.classList.remove('visible');
        }
    }

    // Run on scroll
    window.addEventListener('scroll', toggleAmbient);
    // Run on resize in case hero height changes
    window.addEventListener('resize', function() {
        if (hero) threshold = hero.offsetHeight;
        // Also re-check visibility after resize
        toggleAmbient();
    });
    // Run once on load to set initial state
    toggleAmbient();
})();