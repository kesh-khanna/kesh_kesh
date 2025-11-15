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
    branch.lineTo(0.3, 1.0 + t);
    branch.lineTo(0.15, 1.1 + t);
    branch.lineTo(0, 1.0);
    branch.lineTo(-0.15, 1.1 - t);
    branch.lineTo(-0.3, 1.0 + t);
    branch.closePath();

    const extrude = {
        depth: 0.1 * t - 0.15,
        bevelEnabled: false
    };

    const geom = new THREE.ExtrudeGeometry(branch, extrude);
    const g = new THREE.Group();

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
    const spacing = 3;

    const colorLow = new THREE.Color(0x3344ff);      
    const colorHigh = new THREE.Color(0xffffff);    

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
    "../audio/snow_day.mp3",
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


function animate() {
    requestAnimationFrame(animate);

    for (const flake of snowflakes) {
        flake.traverse(obj => {
            if (obj.isMesh) {
                const tAnim = performance.now() * 0.0008;
                obj.material.metalness = 0.4 + Math.sin(tAnim) * 0.2;
                obj.material.roughness = 0.2 + Math.cos(tAnim) * 0.1;
            }
        });

        const index = snowflakes.indexOf(flake);
        const t = snowflakes.length > 1 ? index / (snowflakes.length - 1) : 0;

        const level = analyser.getAverageFrequency() / 256;
        flake.scale.setScalar(0.8 + level * 0.5);
        // Slightly vary rotation speed using t
        flake.rotation.z += 0.002 + level * 0.02 + 0.002 * t;
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

    renderer.render(scene, camera);
}


animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
