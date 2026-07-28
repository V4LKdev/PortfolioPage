
(function() {
    var glow = document.getElementById('scrollGlow');
    if (!glow) {
        console.warn('Ambient glow element not found!');
        return;
    }

    // State
    var currentX = 0;
    var targetX = 0;
    var currentY = 0;
    var targetY = 0;
    var currentOpacity = 0;
    var targetOpacity = 0;

    var lastActiveId = null;
    var isTransitioning = false;
    var transitionStartTime = 0;

    // Tuning
    var LERP_SPEED = 0.20;
    var SNAP_THRESHOLD = 1.5;      // pixels – slightly larger for stability
    var MAX_TRANSITION_MS = 300;   // force snap after 300ms

    var sections = [
        document.getElementById('about-section'),
        document.getElementById('project-alpha'),
        document.getElementById('project-beta'),
        document.getElementById('project-gamma')
    ].filter(function(el) { return el !== null; });

    if (sections.length === 0) {
        console.warn('No anchor sections found!');
        return;
    }

    function getActiveSection() {
        var viewportCenterY = window.innerHeight / 2;
        for (var i = 0; i < sections.length; i++) {
            var sec = sections[i];
            var rect = sec.getBoundingClientRect();
            if (viewportCenterY >= rect.top && viewportCenterY < rect.bottom) {
                return sec;
            }
            if (viewportCenterY < rect.top) {
                return sec;
            }
        }
        return sections[sections.length - 1];
    }

    function getAnchorPosition(sectionEl) {
        var img = sectionEl.querySelector('.glow-anchor img');
        var rect;
        if (img) {
            rect = img.getBoundingClientRect();
        } else {
            var anchor = sectionEl.querySelector('.glow-anchor');
            if (anchor) {
                rect = anchor.getBoundingClientRect();
            } else {
                var secRect = sectionEl.getBoundingClientRect();
                return {
                    x: secRect.left + secRect.width / 2 - window.innerWidth / 2,
                    y: secRect.top + secRect.height / 2 - window.innerHeight / 2
                };
            }
        }
        return {
            x: rect.left + rect.width / 2 - window.innerWidth / 2,
            y: rect.top + rect.height / 2 - window.innerHeight / 2
        };
    }

    function updateGlow() {
        var active = getActiveSection();
        var pos = null;
        var activeId = active ? active.id : null;

        if (active) {
            pos = getAnchorPosition(active);
            targetX = pos.x;
            targetY = pos.y;
            targetOpacity = 0.65;
        } else {
            targetOpacity = 0;
        }

        // Detect section change
        if (lastActiveId !== activeId) {
            isTransitioning = true;
            transitionStartTime = performance.now(); // record time
            lastActiveId = activeId;
        }

        var now = performance.now();

        if (isTransitioning && pos) {
            // LERP
            currentX += (targetX - currentX) * LERP_SPEED;
            currentY += (targetY - currentY) * LERP_SPEED;
            currentOpacity += (targetOpacity - currentOpacity) * 0.12;

            // Check if we've arrived OR timed out
            var dx = Math.abs(currentX - targetX);
            var dy = Math.abs(currentY - targetY);
            var timedOut = (now - transitionStartTime) > MAX_TRANSITION_MS;

            if ((dx < SNAP_THRESHOLD && dy < SNAP_THRESHOLD) || timedOut) {
                // Force snap
                currentX = targetX;
                currentY = targetY;
                currentOpacity = targetOpacity;
                isTransitioning = false;
            }
        } else {
            // RIGID: exact lock
            currentX = targetX;
            currentY = targetY;
            currentOpacity = targetOpacity;
        }

        glow.style.transform = 'translate(calc(-50% + ' + currentX + 'px), calc(-50% + ' + currentY + 'px))';
        glow.style.opacity = currentOpacity;

        requestAnimationFrame(updateGlow);
    }

    updateGlow();

    window.addEventListener('resize', function() {});
})();