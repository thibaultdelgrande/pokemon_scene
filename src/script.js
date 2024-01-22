import * as THREE from 'three'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


// Charge le fichier audio theme.mp3
const audio = new Audio('/sound/theme.mp3')
// Joue le fichier audio en boucle
audio.loop = true

/**
 * Base
 */

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()

/**
 * Tower
 */

const mtlLoader = new MTLLoader()
mtlLoader.load('scene/roof.mtl', (materials) => {
    materials.preload()
    const objLoader = new OBJLoader()
    objLoader.setMaterials(materials)
    objLoader.load('scene/roof.obj', (object) => {
        object.scale.set(10, 10, 10)
        object.position.set(0, 0, 0)
        object.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.material.transparent = false;
            }
        });
        scene.add(object)
    })
})

// Ajoute un fond noir pour cacher le bas de la tour

const fond = new THREE.Mesh(
    new THREE.BoxGeometry(100, 1, 100),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
)
fond.position.set(0, -10, 0)

scene.add(fond)


/**
 * Reshiram
 */

const gltfLoader = new GLTFLoader()

gltfLoader.load(
    '/reshiram/pokemon.glb',
    (gltf) => {
        gltf.scene.scale.set(2, 2, 2)
        gltf.scene.position.set(0, 0, 15)
        gltf.scene.rotation.y = Math.PI // Rotate by 180 degrees
        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
            }
        });
        scene.add(gltf.scene)
    }
)

/**
 * Hilda
 */

// Load the sprites
const spriteTextures = [];
const spriteNames = ['up', 'down', 'left', 'right'];
const spriteVariations = ['', '_1', '_2'];

for (let name of spriteNames) {
    for (let variation of spriteVariations) {
        const spritePath = `${name}${variation}.png`;
        const spriteTexture = textureLoader.load(`/hilda/${spritePath}`);
        spriteTexture.magFilter = THREE.NearestFilter;
        spriteTexture.minFilter = THREE.NearestFilter;

        spriteTextures.push(spriteTexture);
    }
}

let looking = 'right';

// affiche le sprite up.png
const hilda = new THREE.Sprite(new THREE.SpriteMaterial({ map: spriteTextures[9] }))
// Apliquer la texture sur les deux faces du sprite
hilda.material.side = THREE.DoubleSide
//Placer le centre en bas du sprite
hilda.center.set(0.5, 0)
hilda.scale.set(1.25, 1.25, 1.25)

hilda.position.set(0, 0, 0)
scene.add(hilda)


/**
 * Lights
 */
// Ambient light
const ambientLight = new THREE.AmbientLight('#BBBBFF', 2)
ambientLight.castShadow = true  
scene.add(ambientLight)



/**
 * Collisions boxes
 */

const collisionBoxes = [];

const addCollisionBox = (x, z, width, height) => {

    const collisionBox = new THREE.Mesh(
        new THREE.BoxGeometry(width, 5, height),
        new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
        // Cacher la collision box
        // new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0, depthWrite: false })
    )
    collisionBox.position.set(x, 0, z)
    collisionBoxes.push(collisionBox)
    scene.add(collisionBox)
}

addCollisionBox(4.5, -6, 6, 7)
addCollisionBox(-7, -6, 8, 7)
addCollisionBox(-2, -17, 20, 6)
addCollisionBox(7, -12, 4, 4)
addCollisionBox(-13, -12, 4, 4)
addCollisionBox(0, 16, 10, 4)
addCollisionBox(-2, -5, 2, 2)
addCollisionBox(1, -5, 2, 2)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 200)
camera.position.x = 0
camera.position.y = 20
camera.position.z = -15
camera.lookAt(hilda.position)
hilda.add(camera)

// Update camera
// Si Hilda est entre z -2 et z 14, la caméra va se baisser, et le fov diminue

const updateCamera = () => {
    if (hilda.position.z > -2 && hilda.position.z < 10) {
        camera.fov = 35 + (hilda.position.z + 2) * 5
        camera.updateProjectionMatrix()
        // Rapprocher la caméra de Hilda
        camera.position.z = -15 + (hilda.position.z + 2)/1.25
        camera.position.y = 20 - (hilda.position.z + 2)*1.4
        // Changer également l'orientation de la caméra pour qu'elle regarde toujours Hilda
        camera.lookAt(hilda.position)
    }
}


/**
 * Change Hilda position
 */

hilda.position.x = 5
hilda.position.z = -11.5

/**
 * Move Hilda with keyboard
 */

let key = Array();
let isMoving = false;
let objectif = { x: 0, z: 0 };

document.addEventListener('keydown', (event) => {
    if (key.includes(event.key)) {
        return
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        key.push(event.key)
    }
})

document.addEventListener('keyup', (event) => {
    key.splice(key.indexOf(event.key), 1)
})

const vitesse = 5;
const tailleCase = 1.45;

const moveHilda = (delta) => {
    if (isMoving) {
        // Si cela fait déplacer Hilda plus loin que l'objectif, on la place directement dessus
        if ((hilda.position.x < objectif.x && hilda.position.x + delta * vitesse > objectif.x)
            || (hilda.position.x > objectif.x && hilda.position.x - delta * vitesse < objectif.x)
            || (hilda.position.z < objectif.z && hilda.position.z + delta * vitesse > objectif.z)
            || (hilda.position.z > objectif.z && hilda.position.z - delta * vitesse < objectif.z)) {
            hilda.position.x = objectif.x
            hilda.position.z = objectif.z
            isMoving = false
        }
        // Rapproche Hilda de l'objectif
        else if (hilda.position.x < objectif.x) {
            hilda.position.x += delta * vitesse
        }
        else if (hilda.position.x > objectif.x) {
            hilda.position.x -= delta * vitesse
        }
        else if (hilda.position.z < objectif.z) {
            hilda.position.z += delta * vitesse
        }
        else if (hilda.position.z > objectif.z) {
            hilda.position.z -= delta * vitesse
        }
        // Update camera
        updateCamera()
    }
    if (!isMoving) {
        if (key.length > 0) {
            isMoving = true
            if (key[key.length - 1] === 'ArrowUp') {
                // Empêcher Hilda d'entrer dans une collision box
                for (let collisionBox of collisionBoxes) {
                    if (hilda.position.z + tailleCase > collisionBox.position.z - collisionBox.geometry.parameters.depth / 2
                        && hilda.position.z + tailleCase < collisionBox.position.z + collisionBox.geometry.parameters.depth / 2
                        && hilda.position.x > collisionBox.position.x - collisionBox.geometry.parameters.width / 2
                        && hilda.position.x < collisionBox.position.x + collisionBox.geometry.parameters.width / 2) {
                        looking = 'up'
                        isMoving = false
                        return
                    }
                }
                objectif.z = hilda.position.z + tailleCase
                objectif.x = hilda.position.x
                looking = 'up'
            }
            else if (key[key.length - 1] === 'ArrowDown') {
                for (let collisionBox of collisionBoxes) {
                    if (hilda.position.z - tailleCase > collisionBox.position.z - collisionBox.geometry.parameters.depth / 2
                        && hilda.position.z - tailleCase < collisionBox.position.z + collisionBox.geometry.parameters.depth / 2
                        && hilda.position.x > collisionBox.position.x - collisionBox.geometry.parameters.width / 2
                        && hilda.position.x < collisionBox.position.x + collisionBox.geometry.parameters.width / 2) {
                        looking = 'down'
                        isMoving = false
                        return
                    }
                }
                objectif.z = hilda.position.z - tailleCase
                objectif.x = hilda.position.x
                looking = 'down'
            }
            else if (key[key.length - 1] === 'ArrowLeft') {
                for (let collisionBox of collisionBoxes) {
                    if (hilda.position.x + tailleCase > collisionBox.position.x - collisionBox.geometry.parameters.width / 2
                        && hilda.position.x + tailleCase < collisionBox.position.x + collisionBox.geometry.parameters.width / 2
                        && hilda.position.z > collisionBox.position.z - collisionBox.geometry.parameters.depth / 2
                        && hilda.position.z < collisionBox.position.z + collisionBox.geometry.parameters.depth / 2) {
                        looking = 'left'
                        isMoving = false
                        return
                    }
                }
                objectif.x = hilda.position.x + tailleCase
                objectif.z = hilda.position.z
                looking = 'left'
            }
            else if (key[key.length - 1] === 'ArrowRight') {
                for (let collisionBox of collisionBoxes) {
                    if (hilda.position.x - tailleCase > collisionBox.position.x - collisionBox.geometry.parameters.width / 2
                        && hilda.position.x - tailleCase < collisionBox.position.x + collisionBox.geometry.parameters.width / 2
                        && hilda.position.z > collisionBox.position.z - collisionBox.geometry.parameters.depth / 2
                        && hilda.position.z < collisionBox.position.z + collisionBox.geometry.parameters.depth / 2) {
                        looking = 'right'
                        isMoving = false
                        return
                    }
                }
                objectif.x = hilda.position.x - tailleCase
                objectif.z = hilda.position.z
                looking = 'right'
            }
        }
    }
}

/**
 * Animate Hilda
 */

const vitesseAnimation = 0.25;
let debutAnimation = 0;

const animateHilda = (elapsedTime) => {
    if (isMoving) {
        if (debutAnimation === 0) {
            debutAnimation = elapsedTime
        }
        const delta = elapsedTime - debutAnimation
        if (elapsedTime - debutAnimation > vitesseAnimation * 2) {
            debutAnimation = elapsedTime
        }
        if (elapsedTime - debutAnimation > vitesseAnimation) {
            hilda.material.map = spriteTextures[spriteNames.indexOf(looking) * 3 + 1]
        }
        else {
            hilda.material.map = spriteTextures[spriteNames.indexOf(looking) * 3 + 2]
        }

    } else {
        debutAnimation = 0
        hilda.material.map = spriteTextures[spriteNames.indexOf(looking) * 3]
    }
}


/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */

const clock = new THREE.Clock()
let oldTime = 0;

audio.play()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    // delta = temps depuis la dernière frame
    const delta = elapsedTime - oldTime

    // Move Hilda
    moveHilda(delta)

    // Animate Hilda
    animateHilda(elapsedTime)

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)

    oldTime = elapsedTime
}

tick()