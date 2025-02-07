// Initialize the Three.js scene
const scene = new THREE.Scene();

// Set up an orthographic camera
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
    -100 * aspect, 100 * aspect, 100, -100, 1, 1000
);
camera.position.set(0, 0, 100);
camera.lookAt(new THREE.Vector3(0, 0, 0));

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

renderer.setClearColor(0xffffff); // White background

// Add grid helper
const gridHelper = new THREE.GridHelper(200, 20, 0x000000, 0x999999);
gridHelper.rotation.x = Math.PI / 2;
scene.add(gridHelper);

// Variables for polygon
let vertices = [];
let edges = [];
let polygonMesh = null;
let polygonOutline = null;

// Raycaster for clicks
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Function to add a vertex where the user clicks
window.addEventListener("click", (event) => {
    if (event.target.tagName === "BUTTON" || event.target.tagName === "INPUT") {
        return; // Ignore clicks on UI elements
    }

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const point = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, point);

    vertices.push(point.clone());

    if (vertices.length > 1) {
        const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
        const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        edges.push(line);
    }
});

// Complete polygon
document.getElementById("completePolygon").addEventListener("click", () => {
    if (vertices.length < 3) {
        alert("You need at least 3 vertices to form a polygon.");
        return;
    }

    const closedVertices = [...vertices, vertices[0]];

    const outlineGeometry = new THREE.BufferGeometry().setFromPoints(closedVertices);
    const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

    polygonOutline = new THREE.LineLoop(outlineGeometry, outlineMaterial);
    scene.add(polygonOutline);

    const shape = new THREE.Shape();
    shape.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
        shape.lineTo(vertices[i].x, vertices[i].y);
    }
    shape.lineTo(vertices[0].x, vertices[0].y);

    const shapeGeometry = new THREE.ShapeGeometry(shape);
    const shapeMaterial = new THREE.MeshBasicMaterial({
        color: 0xffa500, // Orange
        side: THREE.DoubleSide
    });

    polygonMesh = new THREE.Mesh(shapeGeometry, shapeMaterial);
    scene.add(polygonMesh);

    vertices = []; // Clear vertices
});

// Copy polygon
document.getElementById("copyPolygon").addEventListener("click", () => {
    if (!polygonMesh) {
        alert("No polygon to copy.");
        return;
    }

    const copiedPolygon = polygonMesh.clone();
    scene.add(copiedPolygon);

    // Function to move the copied polygon with the cursor
    function moveWithCursor(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const point = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, point);

        copiedPolygon.position.set(point.x, point.y, 0);
    }

    // Attach the mousemove event to move the polygon
    window.addEventListener("mousemove", moveWithCursor);

    // Stop the movement when the user clicks to place the copied polygon
    function placePolygon(event) {
        if (event.target.tagName === "BUTTON" || event.target.tagName === "INPUT") {
            return; // Ignore clicks on UI elements
        }

        window.removeEventListener("mousemove", moveWithCursor);
        window.removeEventListener("click", placePolygon); // Remove this event listener
    }

    // Attach the click event to stop the movement and place the polygon
    window.addEventListener("click", placePolygon);
});

// Reset the scene
document.getElementById("reset").addEventListener("click", () => {
    edges.forEach((edge) => scene.remove(edge));
    if (polygonMesh) scene.remove(polygonMesh);
    if (polygonOutline) scene.remove(polygonOutline);

    vertices = [];
    edges = [];
    polygonMesh = null;
    polygonOutline = null;
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();