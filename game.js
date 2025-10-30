const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 1000);
camera.position.set(0, 6, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Lighting
const hemi = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.9);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 10, 5);
dir.castShadow = true;
scene.add(dir);

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ color: 0x6b8e23 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Rod
const rod = new THREE.Mesh(
  new THREE.CylinderGeometry(0.08, 0.08, 10, 12),
  new THREE.MeshStandardMaterial({ color: 0x8b5a2b })
);
rod.rotation.z = Math.PI / 2;
rod.position.set(0, 3, -1.5);
rod.castShadow = true;
scene.add(rod);

// Hen
const hen = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.SphereGeometry(0.8, 16, 12),
  new THREE.MeshStandardMaterial({ color: 0xfff1c9 })
);
body.scale.set(1.4, 1.05, 0.95);
hen.add(body);

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.35, 12, 12),
  new THREE.MeshStandardMaterial({ color: 0xffffff })
);
head.position.set(0.95, 0.15, 0);
hen.add(head);

const beak = new THREE.Mesh(
  new THREE.ConeGeometry(0.13, 0.3, 8),
  new THREE.MeshStandardMaterial({ color: 0xffa500 })
);
beak.rotation.z = Math.PI / 2;
beak.position.set(1.16, 0.15, 0);
hen.add(beak);

const wing = new THREE.Mesh(
  new THREE.BoxGeometry(0.7, 0.35, 0.02),
  new THREE.MeshStandardMaterial({ color: 0xf5d6b0 })
);
wing.position.set(0, 0.05, 0.45);
wing.rotation.z = -0.6;
hen.add(wing);

hen.position.set(-3, 3.3, -1.5);
scene.add(hen);

// Basket
const basket = new THREE.Group();
const basketBody = new THREE.Mesh(
  new THREE.CylinderGeometry(1.2, 1.2, 0.6, 24, true),
  new THREE.MeshStandardMaterial({ color: 0x8b4513, side: THREE.DoubleSide })
);
basketBody.position.y = 0.35;
basket.add(basketBody);

const basketBase = new THREE.Mesh(
  new THREE.CircleGeometry(1.2, 24),
  new THREE.MeshStandardMaterial({ color: 0x5c3317 })
);
basketBase.rotation.x = -Math.PI / 2;
basketBase.position.y = 0.05;
basket.add(basketBase);

basket.position.set(0, 0, 0);
scene.add(basket);

// Eggs + score setup
const eggs = [];
let score = 0;
const scoreEl = document.getElementById('score');

// Movement setup
let pointerX = 0;
const keys = { left: false, right: false, up: false, down: false };

window.addEventListener('mousemove', (e) => {
  pointerX = (e.clientX / innerWidth) * 2 - 1;
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keys.left = true;
  if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keys.right = true;
  if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') keys.up = true;
  if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') keys.down = true;
  if (e.code === 'Space') spawnEgg();
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keys.left = false;
  if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keys.right = false;
  if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') keys.up = false;
  if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') keys.down = false;
});
window.addEventListener('mousedown', spawnEgg);

function spawnEgg() {
  const geom = new THREE.SphereGeometry(0.18, 12, 10);
  geom.scale(1, 1.2, 1);
  const mat = new THREE.MeshStandardMaterial({ color: 0xfffff0 });
  const egg = new THREE.Mesh(geom, mat);
  const pos = new THREE.Vector3();
  hen.getWorldPosition(pos);
  egg.position.copy(pos).add(new THREE.Vector3(0, -0.45, 0.2));
  scene.add(egg);
  eggs.push({ mesh: egg, vel: new THREE.Vector3(0, 0, 0) });
}

const gravity = -9.8;
const clock = new THREE.Clock();

function animate() {
  const dt = Math.min(0.05, clock.getDelta());
  hen.position.y = 3.3 + Math.sin(clock.elapsedTime * 2) * 0.03;

  // Basket movement controls
  const moveSpeed = 6 * dt;
  if (keys.left) basket.position.x -= moveSpeed;
  if (keys.right) basket.position.x += moveSpeed;
  if (keys.up) basket.position.z -= moveSpeed; // forward
  if (keys.down) basket.position.z += moveSpeed; // backward

  // Define basket collision area
  const basketY = basket.position.y + 0.5;
  const basketRadius = 1.2;

  for (let i = eggs.length - 1; i >= 0; i--) {
    const e = eggs[i];
    e.vel.y += gravity * dt;
    e.mesh.position.addScaledVector(e.vel, dt);
    e.mesh.rotation.x += dt * 2;
    e.mesh.rotation.z += dt * 1.2;

    // collision check
    if (
      Math.abs(e.mesh.position.x - basket.position.x) < basketRadius &&
      Math.abs(e.mesh.position.z - basket.position.z) < basketRadius &&
      e.mesh.position.y < basketY + 0.2 &&
      e.mesh.position.y > basketY - 0.2
    ) {
      scene.remove(e.mesh);
      eggs.splice(i, 1);
      score++;
      scoreEl.textContent = 'Score: ' + score;
      continue;
    }

    // remove missed eggs
    if (e.mesh.position.y < -2) {
      scene.remove(e.mesh);
      eggs.splice(i, 1);
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
camera.lookAt(0, 2, 0);
