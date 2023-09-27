import * as THREE from '../assets/js/vendor/three.js';
import { OrbitControls } from '../assets/js/vendor/OrbitControls.js';
const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

let camera, scene, renderer, controls;

let currentDirectory;
let filesInDirectory;
let currentIndex;
let geometry;

init();
animate();

function init() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);

    scene = new THREE.Scene();

    geometry = new THREE.SphereGeometry(500, 120, 80);
    geometry.scale(-1, 1, 1);

    // Replace with your 360 image path
    const texture = new THREE.TextureLoader().load("../assets/images/World_elevation_map.png");
    const material = new THREE.MeshBasicMaterial({ map: texture });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableZoom = false;
    controls.maxDistance = 500;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = .2;
    controls.rotateSpeed = -0.5;
    controls.addEventListener('change', () => console.log("Controls Change"));
    controls.addEventListener('start', () => console.log("Controls Start Event"));
    controls.addEventListener('end', () => console.log("Controls End Event"));
    controls.update();

    window.addEventListener('resize', onWindowResize, false);

    ipcRenderer.send('open-file-dialog');

    attachDragAndDropEvents();
}

function attachDragAndDropEvents() {
    const dragOverlay = document.getElementById('drag-overlay');
    let dragEnterCounter = 0;

    document.addEventListener('dragover', (event) => {
        event.preventDefault();
        return false;
    }, false);

    document.addEventListener('dragenter', (event) => {
        dragEnterCounter++;
        if (dragEnterCounter === 1) {
            dragOverlay.style.display = 'block';
        }
    }, false);

    document.addEventListener('dragleave', (event) => {
        dragEnterCounter--;
        if (dragEnterCounter === 0) {
            dragOverlay.style.display = 'none';
        }
    }, false);

    document.addEventListener('drop', (event) => {
        event.preventDefault();
        dragEnterCounter = 0; // Reset the counter
        dragOverlay.style.display = 'none';

        const file = event.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
            let imagePath = file.path;

            // Load the image into your 360 viewer
            load360Image(imagePath);
        }

        return false;
    }, false);
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
        loadNextImage();
    } else if (event.key === 'ArrowLeft') {
        loadPreviousImage();
    }
});

ipcRenderer.on('selected-file', (event, imagePath) => {
    load360Image(imagePath);

    loadThumbnailsAsync();

    updateHighlightedThumbnail();
});

document.addEventListener('wheel', onDocumentMouseWheel, false);

function onDocumentMouseWheel(event) {
    if (event.deltaY > 0) {
        camera.fov += 1;
    } else {
        camera.fov -= 1;
    }
    camera.fov = THREE.MathUtils.clamp(camera.fov, 10, 100);
    camera.updateProjectionMatrix();
}

function load360Image(imagePath) {
    const texture = new THREE.TextureLoader().load(imagePath);
    const material = new THREE.MeshBasicMaterial({ map: texture });

    scene.children = []; // Remove previous mesh from the scene
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Set the current directory and list of files
    currentDirectory = path.dirname(imagePath);
    filesInDirectory = fs.readdirSync(currentDirectory).filter(file => ['.jpg', '.png'].includes(path.extname(file)));
    currentIndex = filesInDirectory.indexOf(path.basename(imagePath));

    // Display the image file name in the title
    document.title = '360 Image Viewer - ' + imagePath;

    updateHighlightedThumbnail();
}

function loadNextImage() {
    if (currentIndex < filesInDirectory.length - 1) {
        currentIndex++;
        load360Image(path.join(currentDirectory, filesInDirectory[currentIndex]));
    }
}

function loadPreviousImage() {
    if (currentIndex > 0) {
        currentIndex--;
        load360Image(path.join(currentDirectory, filesInDirectory[currentIndex]));
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

ipcRenderer.on('selected-file', (event, imagePath) => {
    load360Image(imagePath);

    // Populate the thumbnail carousel
    populateThumbnailCarousel();
});

function updateHighlightedThumbnail() {
    // Remove the 'highlighted' class from all thumbnails
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach((t) => t.classList.remove('highlighted'));

    // Add the 'highlighted' class to the thumbnail at the current index
    if (currentIndex >= 0 && currentIndex < thumbnails.length) {
        thumbnails[currentIndex].classList.add('highlighted');
    }
}

function highlightSelectedThumbnail() {
    // Remove the highlight from all thumbnails
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumbnail) => {
        thumbnail.classList.remove('selected');
    });

    // Highlight the selected thumbnail
    if (currentIndex >= 0 && currentIndex < thumbnails.length) {
        thumbnails[currentIndex].classList.add('selected');
    }
}

// Wrap the entire loadThumbnailsAsync function inside an async function
async function loadThumbnailsAsync() {
    const thumbnailCarousel = document.getElementById('thumbnail-carousel');
    
    // Clear existing thumbnails
    thumbnailCarousel.innerHTML = '';

    // Asynchronously load thumbnails
    for (let index = 0; index < filesInDirectory.length; index++) {
        const imageFileName = filesInDirectory[index];

        // Create a container div for each thumbnail
        const thumbnailContainer = document.createElement('div');
        thumbnailContainer.classList.add('thumbnail-container');

        // Create an image element for the thumbnail
        const thumbnail = document.createElement('img');
        thumbnail.src = path.join(currentDirectory, imageFileName);
        thumbnail.classList.add('thumbnail');
        thumbnailContainer.appendChild(thumbnail);

        // Create a div for the image name and add it above the thumbnail
        const imageNameDiv = document.createElement('div');
        imageNameDiv.classList.add('image-name');
        imageNameDiv.innerText = imageFileName;
        thumbnailContainer.appendChild(imageNameDiv);

        // Load the image and wait for it to complete
        await loadImageAsync(thumbnail, path.join(currentDirectory, imageFileName));

        // Add click event listener
        thumbnailContainer.addEventListener('click', () => {
            // Remove the 'highlighted' class from all thumbnails
            const thumbnails = document.querySelectorAll('.thumbnail');
            thumbnails.forEach((t) => t.classList.remove('highlighted'));

            // Add the 'highlighted' class to the clicked thumbnail
            thumbnail.classList.add('highlighted');

            // Load the clicked image
            load360Image(path.join(currentDirectory, imageFileName));
        });

        // Append the thumbnail container to the carousel
        thumbnailCarousel.appendChild(thumbnailContainer);
    }
}

// Asynchronous function to load an image
function loadImageAsync(element, imagePath) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = imagePath;

        image.onload = () => {
            // Set the source of the element when the image is loaded
            element.src = imagePath;
            resolve();
        };

        image.onerror = (error) => {
            reject(error);
        };
    });
}
