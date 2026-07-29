
(() => {
    'use strict';

    const FRACTAL_NAME = 'Julia Set';

    const MOBILE_BREAKPOINT = 736;
    const TARGET_FPS = 30;
    const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;

    const MAX_DEVICE_PIXEL_RATIO = 2.0;
    const MAX_RENDER_PIXELS = 4_000_000;

    const banner = document.querySelector('.banner');
    const canvas = banner?.querySelector('.fractal-canvas');
    const labelName = banner?.querySelector('.fractal-label-name');

    if (
        !(banner instanceof HTMLElement) ||
        !(canvas instanceof HTMLCanvasElement)
    ) {
        console.warn('[fractal] Hero banner or fractal canvas not found.');
        return;
    }

    const mobileQuery = window.matchMedia(
        `(max-width: ${MOBILE_BREAKPOINT}px)`
    );

    const reducedMotionQuery = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    );

    /*
     * Reduced-motion users always receive the static CSS fallback.
     */
    if (reducedMotionQuery.matches) {
        console.info('[fractal] Reduced motion enabled. Using fallback.');
        return;
    }

    const gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance'
    });

    if (!gl) {
        console.info('[fractal] WebGL unavailable. Using fallback.');
        return;
    }

    const vertexShaderSource = `
        attribute vec2 a_position;

        varying vec2 v_uv;

        void main() {
            v_uv = a_position * 0.5 + 0.5;
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    const fragmentShaderSource = `
        precision highp float;

        varying vec2 v_uv;

        uniform vec2 u_resolution;
        uniform float u_time;

        const int MAX_ITER = 160;

        mat2 rotate2D(float angle) {
            float c = cos(angle);
            float s = sin(angle);

            return mat2(
                 c, -s,
                 s,  c
            );
        }

        /*
         * Midnight blue palette.
         *
         * This keeps the locked shader structure while replacing
         * the previous green-teal cast with clearly blue values.
         */
        vec3 palette(float t) {
            vec3 deep = vec3(
                0.004,
                0.010,
                0.026
            );

            vec3 midnight = vec3(
                0.012,
                0.044,
                0.115
            );

            vec3 oceanBlue = vec3(
                0.025,
                0.155,
                0.390
            );

            vec3 iceBlue = vec3(
                0.245,
                0.510,
                0.900
            );

            vec3 colour = mix(
                deep,
                midnight,
                smoothstep(0.00, 0.38, t)
            );

            colour = mix(
                colour,
                oceanBlue,
                smoothstep(0.22, 0.74, t)
            );

            colour = mix(
                colour,
                iceBlue,
                smoothstep(0.74, 1.00, t) * 0.42
            );

            return colour;
        }

        void main() {
            vec2 uv = v_uv * 2.0 - 1.0;

            uv.x *= u_resolution.x / u_resolution.y;

            float time = u_time * 0.55;

            vec2 p = uv;

            /*
             * Move the visual centre toward the right side.
             */
            p.x -= 0.58;

            float zoom =
                0.98 +
                0.018 * sin(time * 0.34);

            /*
             * Permanent left-up / right-down tilt.
             */
            float baseTilt = -0.22;

            float animatedTilt =
                0.025 * sin(time * 0.19);

            p =
                rotate2D(baseTilt + animatedTilt) *
                p *
                zoom;

            /*
             * Stable Julia parameter with restrained movement.
             */
            vec2 c = vec2(
                -0.790 + 0.006 * cos(time * 0.16),
                 0.156 + 0.006 * sin(time * 0.12)
            );

            vec2 z = p;

            float escaped = 0.0;
            float smoothIteration = 0.0;

            float orbitTrap = 1000.0;
            float axisTrap = 1000.0;

            for (int i = 0; i < MAX_ITER; ++i) {
                float x =
                    z.x * z.x -
                    z.y * z.y +
                    c.x;

                float y =
                    2.0 *
                    z.x *
                    z.y +
                    c.y;

                z = vec2(x, y);

                float radius = length(z);

                orbitTrap = min(
                    orbitTrap,
                    abs(radius - 0.72)
                );

                axisTrap = min(
                    axisTrap,
                    min(abs(z.x), abs(z.y))
                );

                float radiusSquared = dot(z, z);

                if (radiusSquared > 64.0) {
                    escaped = 1.0;

                    smoothIteration =
                        float(i) +
                        1.0 -
                        log2(log2(radiusSquared));

                    break;
                }
            }

            /*
             * Filled interior prevents isolated black pixels.
             */
            if (escaped < 0.5) {
                float interiorDetail = exp(
                    -8.0 *
                    min(orbitTrap, axisTrap)
                );

                vec3 interiorDark = vec3(
                    0.004,
                    0.014,
                    0.038
                );

                vec3 interiorBlue = vec3(
                    0.010,
                    0.070,
                    0.185
                );

                vec3 interiorColour = mix(
                    interiorDark,
                    interiorBlue,
                    clamp(interiorDetail, 0.0, 1.0)
                );

                float interiorAlpha =
                    0.82 +
                    0.16 * interiorDetail;

                gl_FragColor = vec4(
                    interiorColour,
                    interiorAlpha
                );

                return;
            }

            float iterationNormalised = clamp(
                smoothIteration / float(MAX_ITER),
                0.0,
                1.0
            );

            /*
             * Animated contours that never become fully dark.
             */
            float bands =
                0.5 +
                0.5 *
                cos(
                    smoothIteration * 0.18 -
                    u_time * 0.22
                );

            bands =
                0.35 +
                0.65 *
                pow(bands, 1.4);

            float boundary = exp(
                -13.0 * orbitTrap
            );

            float filaments = exp(
                -20.0 * axisTrap
            );

            filaments = pow(
                filaments,
                1.8
            );

            vec3 colour = palette(
                clamp(
                    0.18 +
                    iterationNormalised * 0.72 +
                    bands * 0.08,
                    0.0,
                    1.0
                )
            );

            /*
             * Deep-blue boundary glow.
             */
            colour +=
                vec3(
                    0.010,
                    0.095,
                    0.255
                ) *
                boundary *
                0.38;

            /*
             * Brighter blue filament glow.
             */
            colour +=
                vec3(
                    0.080,
                    0.315,
                    0.780
                ) *
                filaments *
                0.30;

            /*
             * Subtle moving blue shimmer.
             */
            float shimmer =
                0.5 +
                0.5 *
                sin(
                    smoothIteration * 0.11 +
                    u_time * 0.18
                );

            colour +=
                vec3(
                    0.150,
                    0.410,
                    0.920
                ) *
                boundary *
                shimmer *
                0.10;

            /*
             * Sparse warm accent matching the lava UI colour.
             */
            float ember = pow(
                max(
                    0.0,
                    sin(
                        smoothIteration * 0.095 -
                        u_time * 0.15
                    )
                ),
                6.0
            );

            colour +=
                vec3(
                    0.950,
                    0.360,
                    0.120
                ) *
                filaments *
                boundary *
                ember *
                0.08;

            float feature = clamp(
                boundary * 1.10 +
                filaments * 0.35 +
                bands * boundary * 0.18,
                0.0,
                1.0
            );

            /*
             * Feather only at the outer hero edges.
             */
            vec2 maskUv = v_uv * 2.0 - 1.0;

            maskUv.x *= 1.02;
            maskUv.y *= 1.08;

            float edgeMask =
                1.0 -
                smoothstep(
                    0.92,
                    1.22,
                    length(maskUv)
                );

            float alpha =
                edgeMask *
                feature;

            if (alpha < 0.006) {
                gl_FragColor = vec4(0.0);
                return;
            }

            gl_FragColor = vec4(
                colour,
                alpha
            );
        }
    `;

    function compileShader(type, source) {
        const shader = gl.createShader(type);

        if (!shader) {
            throw new Error('Failed to create WebGL shader.');
        }

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const message =
                gl.getShaderInfoLog(shader) ||
                'Unknown shader compilation error.';

            gl.deleteShader(shader);
            throw new Error(message);
        }

        return shader;
    }

    function createProgram() {
        const vertexShader = compileShader(
            gl.VERTEX_SHADER,
            vertexShaderSource
        );

        const fragmentShader = compileShader(
            gl.FRAGMENT_SHADER,
            fragmentShaderSource
        );

        const program = gl.createProgram();

        if (!program) {
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);

            throw new Error('Failed to create WebGL program.');
        }

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const message =
                gl.getProgramInfoLog(program) ||
                'Unknown WebGL link error.';

            gl.deleteProgram(program);
            throw new Error(message);
        }

        return program;
    }

    let program;

    try {
        program = createProgram();
    } catch (error) {
        console.error('[fractal] Shader setup failed:', error);
        return;
    }

    const positionLocation = gl.getAttribLocation(
        program,
        'a_position'
    );

    const resolutionLocation = gl.getUniformLocation(
        program,
        'u_resolution'
    );

    const timeLocation = gl.getUniformLocation(
        program,
        'u_time'
    );

    if (
        positionLocation < 0 ||
        resolutionLocation === null ||
        timeLocation === null
    ) {
        console.error('[fractal] Required shader locations not found.');
        gl.deleteProgram(program);
        return;
    }

    const positionBuffer = gl.createBuffer();

    if (!positionBuffer) {
        console.error('[fractal] Failed to create vertex buffer.');
        gl.deleteProgram(program);
        return;
    }

    gl.useProgram(program);

    gl.bindBuffer(
        gl.ARRAY_BUFFER,
        positionBuffer
    );

    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            -1, -1,
            1, -1,
            -1,  1,

            -1,  1,
            1, -1,
            1,  1
        ]),
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.clearColor(0, 0, 0, 0);

    gl.enable(gl.BLEND);

    gl.blendFunc(
        gl.SRC_ALPHA,
        gl.ONE_MINUS_SRC_ALPHA
    );

    if (labelName instanceof HTMLElement) {
        labelName.textContent = FRACTAL_NAME;
    }

    let active = false;
    let heroVisible = true;
    let pageVisible = document.visibilityState === 'visible';

    let resizePending = true;
    let animationFrameId = 0;

    let previousTimestamp = 0;
    let previousDrawTimestamp = 0;
    let animationTime = 0;

    let renderWidth = 1;
    let renderHeight = 1;

    function calculateRenderSize() {
        const rect = banner.getBoundingClientRect();

        const dpr = Math.min(
            window.devicePixelRatio || 1,
            MAX_DEVICE_PIXEL_RATIO
        );

        let width = Math.max(
            1,
            Math.round(rect.width * dpr)
        );

        let height = Math.max(
            1,
            Math.round(rect.height * dpr)
        );

        const pixelCount = width * height;

        if (pixelCount > MAX_RENDER_PIXELS) {
            const scale = Math.sqrt(
                MAX_RENDER_PIXELS / pixelCount
            );

            width = Math.max(
                1,
                Math.round(width * scale)
            );

            height = Math.max(
                1,
                Math.round(height * scale)
            );
        }

        return { width, height };
    }

    function drawCurrentFrame() {
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);

        gl.uniform2f(
            resolutionLocation,
            renderWidth,
            renderHeight
        );

        gl.uniform1f(
            timeLocation,
            animationTime
        );

        gl.drawArrays(
            gl.TRIANGLES,
            0,
            6
        );
    }

    function resizeAndDraw() {
        const { width, height } = calculateRenderSize();

        if (
            canvas.width !== width ||
            canvas.height !== height
        ) {
            canvas.width = width;
            canvas.height = height;

            renderWidth = width;
            renderHeight = height;

            gl.viewport(
                0,
                0,
                width,
                height
            );
        }

        resizePending = false;

        /*
         * Redraw immediately after backing-buffer resize.
         */
        drawCurrentFrame();
    }

    function shouldRender() {
        return (
            active &&
            heroVisible &&
            pageVisible
        );
    }

    function frame(timestamp) {
        animationFrameId = 0;

        if (!shouldRender()) {
            return;
        }

        if (previousTimestamp === 0) {
            previousTimestamp = timestamp;
        }

        animationTime += Math.min(
            (timestamp - previousTimestamp) / 1000,
            0.1
        );

        previousTimestamp = timestamp;

        if (resizePending) {
            resizeAndDraw();
            previousDrawTimestamp = timestamp;
        } else if (
            timestamp - previousDrawTimestamp >=
            FRAME_INTERVAL_MS
        ) {
            drawCurrentFrame();
            previousDrawTimestamp = timestamp;
        }

        animationFrameId = requestAnimationFrame(frame);
    }

    function start() {
        if (
            !shouldRender() ||
            animationFrameId !== 0
        ) {
            return;
        }

        previousTimestamp = 0;
        animationFrameId = requestAnimationFrame(frame);
    }

    function stop() {
        if (animationFrameId !== 0) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = 0;
        }

        previousTimestamp = 0;
    }

    function updateMode() {
        active = !mobileQuery.matches;

        banner.classList.toggle(
            'fractal-enabled',
            active
        );

        if (active) {
            resizePending = true;
            resizeAndDraw();
            start();
        } else {
            stop();
        }
    }

    const resizeObserver = new ResizeObserver(() => {
        if (active) {
            resizePending = true;
        }
    });

    resizeObserver.observe(banner);

    const intersectionObserver = new IntersectionObserver(
        ([entry]) => {
            heroVisible = Boolean(entry?.isIntersecting);

            if (shouldRender()) {
                start();
            } else {
                stop();
            }
        },
        {
            rootMargin: '120px 0px',
            threshold: 0
        }
    );

    intersectionObserver.observe(banner);

    document.addEventListener(
        'visibilitychange',
        () => {
            pageVisible =
                document.visibilityState === 'visible';

            if (shouldRender()) {
                start();
            } else {
                stop();
            }
        }
    );

    if (
        typeof mobileQuery.addEventListener === 'function'
    ) {
        mobileQuery.addEventListener(
            'change',
            updateMode
        );
    } else {
        mobileQuery.addListener?.(updateMode);
    }

    updateMode();

    console.info(
        `[fractal] ${FRACTAL_NAME} initialised.`
    );
})();