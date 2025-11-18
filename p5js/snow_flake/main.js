import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('app').appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 10);

const slider = document.getElementById("flakeCount");
const flakeValue = document.getElementById("flakeValue");

const seekSlider = document.getElementById("audioSeek");
const fftCanvas = document.getElementById("fftCanvas");
const fftCtx = fftCanvas.getContext("2d");


new OrbitControls(camera, renderer.domElement);

slider.addEventListener("input", () => {
    const count = parseInt(slider.value)
    flakeValue.textContent = count;
    // adjust the camera position accorindly
    camera.position.set(0, 1, count * 2)
    updateSnowflakes(count);
});

const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
scene.add(hemi);

const point = new THREE.PointLight(0xffffff, 1);
point.position.set(2, 2, 2);
scene.add(point);

function createSnowflake(i, totalSnowFlakes = 3) {

    const t = i / totalSnowFlakes;
    const branch = new THREE.Shape();
    branch.moveTo(0, 0);
    branch.lineTo(0.3 - 0.1 * t, 1.0 - t);
    branch.lineTo(0.15, 1.1 + t);
    branch.lineTo(0, 1.0 - t);
    branch.lineTo(-0.15, 1.1 + t);
    branch.lineTo(-0.3 + 0.1 * t, 1.0 - t);
    branch.closePath();

    const extrude = { depth: 0.1 * t - 0.15, bevelEnabled: false };

    const geom = new THREE.ExtrudeGeometry(branch, extrude); const g = new THREE.Group();
    let min_branches = 5;
    for (let j = 0; j < (min_branches + i); j++) {
        const mesh = new THREE.Mesh(geom);
        mesh.rotation.z = (Math.PI * 2 * j) / (min_branches + i);
        g.add(mesh);
    }
    return g;
}
const snowflakes = [];

function updateSnowflakes(count) {
    snowflakes.forEach(flake => scene.remove(flake));
    snowflakes.length = 0;
    createAddFlakes(count);
}

function createAddFlakes(totalSnowFlakes = 3) {
    const spacing = 3.5;

    const colorLow  = new THREE.Color(0xff0000);  // red
    const colorHigh = new THREE.Color(0x3366ff); 

    const emissiveLow = new THREE.Color(0x332211);
    const emissiveHigh = new THREE.Color(0x88ccff);

    const metalnessLow = 0.1;
    const metalnessHigh = 0.8;

    const roughnessLow = 0.8;
    const roughnessHigh = 0.2;

    for (let i = 0; i < totalSnowFlakes; i++) {
        const flake = createSnowflake(i, totalSnowFlakes);
        scene.add(flake);

        flake.position.x = (i - (totalSnowFlakes - 1) / 2) * spacing;
        if (i % 2 !== 0) flake.position.y += 1;

        snowflakes.push(flake);

        const t = totalSnowFlakes > 1 ? i / (totalSnowFlakes - 1) : 0;

        flake.traverse(obj => {
            if (obj.isMesh) {
                const color = colorLow.clone().lerp(colorHigh, t);
                const emissive = emissiveLow.clone().lerp(emissiveHigh, t);
                const metalness = metalnessLow + (metalnessHigh - metalnessLow) * t;
                const roughness = roughnessLow + (roughnessHigh - roughnessLow) * t;

                obj.material = new THREE.MeshStandardMaterial({
                    color: color,
                    emissive: emissive,
                    metalness: metalness,
                    roughness: roughness
                });
                // get the original static color for animation
                obj.material.userData.originalColor = obj.material.color.clone();
                obj.material.userData.originalEmissive = obj.material.emissive.clone();
            }
        });

        
    }
}

createAddFlakes();

const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);

const audioLoader = new THREE.AudioLoader();
audioLoader.load(
    "../audio/dubby_min.mp3",
    buffer => {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.7);
        sound.play();
    }
);

const analyser = new THREE.AudioAnalyser(sound, 64);

const musicButton = document.getElementById("musicToggle");

musicButton.addEventListener("click", () => {
    if (sound.isPlaying) {
        sound.pause();
        musicButton.textContent = "play";
    } else {
        sound.play();
        musicButton.textContent = "pause";
    }
});

// update scrubber position as song plays
if (sound.buffer && sound.isPlaying) {
    seekSlider.value = sound.context.currentTime / sound.buffer.duration;
}

seekSlider.addEventListener("input", () => {
    if (!sound.buffer) return;

    const targetTime = seekSlider.value * sound.buffer.duration;

    // jump in audio
    sound.offset = targetTime;
    
    if (sound.isPlaying) {
        sound.stop();
        sound.play(sound.offset);
    }
});


// get the frequencies that each flake should react too
function getBinRangeForFlake(flakeIndex, totalFlakes, fftSize) {
    const binsPerFlake = Math.floor(fftSize / totalFlakes);
    const start = flakeIndex * binsPerFlake;
    const end = (flakeIndex === totalFlakes - 1)
        ? fftSize - 1                      // last flake gets leftovers
        : start + binsPerFlake;

    return [start, end];
}

// get energy amplitude only from that frequency range
function getFlakeEnergy(analyser, start, end) {
    const data = analyser.getFrequencyData();
    let sum = 0;

    for (let i = start; i < end; i++) sum += data[i];

    return sum / (end - start); // average
}

let pixelSnow;

function createPixelSnow(count = 500) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];

    for (let i = 0; i < count; i++) {
        positions.push(
            (Math.random() - 0.5) * 50, // x
            Math.random() * 20 + 5,     // y, start above view
            (Math.random() - 0.5) * 50  // z
        );
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,        // small pixelated size
        sizeAttenuation: true
    });

    pixelSnow = new THREE.Points(geometry, material);
    scene.add(pixelSnow);
}

createPixelSnow(1500);

function drawFFT() {
    const data = analyser.getFrequencyData();
    const count = data.length;

    fftCtx.clearRect(0, 0, fftCanvas.width, fftCanvas.height);

    const barWidth = fftCanvas.width / count;

    for (let i = 0; i < count; i++) {
        const v = data[i] / 256;
        const barHeight = v * fftCanvas.height;

        fftCtx.fillStyle = `rgb(${v * 255}, ${50}, ${255 - v * 255})`;
        fftCtx.fillRect(i * barWidth, fftCanvas.height - barHeight, barWidth - 1, barHeight);
    }
}

// energy is too spiky so we want to smooth
const smoothedEnergy = [];
function animate() {
    requestAnimationFrame(animate);

    for (let index = 0; index < snowflakes.length; index++) {
        const flake = snowflakes[index];
        const total = snowflakes.length;

        // frequency range assigned to this flake
        const [start, end] = getBinRangeForFlake(index, total, analyser.analyser.frequencyBinCount);
        const energy_frame = getFlakeEnergy(analyser, start, end) / 256;

        // smooth out the engery a bit
        if (smoothedEnergy[index] === undefined) smoothedEnergy[index] = 0;
        const smoothFactor = 0.25;
        smoothedEnergy[index] =
            smoothedEnergy[index] * (1 - smoothFactor) + energy_frame * smoothFactor;

        const energy = smoothedEnergy[index];

        const t = total > 1 ? index / (total - 1) : 0;

        // main geometric animation
        flake.scale.setScalar(0.8 + energy * 1.2);
        flake.rotation.z += 0.002 + 0.002 * t;

        // apply audio-reactive color changes
        flake.traverse(obj => {
        if (!obj.isMesh) return;

            const mat = obj.material;
            const originalColor = mat.userData.originalColor;
            const originalEmissive = mat.userData.originalEmissive;

            // Red → Blue gradient based on energy
            const low = new THREE.Color(0xff0000);
            const high = new THREE.Color(0x3366ff);
            const reactiveColor = low.clone().lerp(high, energy);

            // Blend original color with reactive color
            const colorBlend = 0.5 * energy;   // how “strong” the audio tint is
            mat.color.copy(originalColor).lerp(reactiveColor, colorBlend);

            // Emissive glow fades back naturally
            const emissiveBoost = energy * 1.5;
            mat.emissive.copy(originalEmissive).multiplyScalar(1 + emissiveBoost);

            mat.needsUpdate = true;
        });
    }


        if (pixelSnow) {
            const positions = pixelSnow.geometry.attributes.position.array;
            for (let i = 1; i < positions.length; i += 3) {
                positions[i] -= 0.01;

                if (positions[i] < -5) {
                    positions[i] = 20;
                    positions[i - 2] = (Math.random() - 0.5) * 50;
                    positions[i - 1] = 20;
                    positions[i] = 20;
                }
            }
            pixelSnow.geometry.attributes.position.needsUpdate = true;
        }
        drawFFT();
        renderer.render(scene, camera);
    }


    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
