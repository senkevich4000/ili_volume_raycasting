import {
    Scene,
    Group,
    Object3D,
    Color,
    OrthographicCamera,
    CameraHelper,
    AxesHelper,
    WebGLRenderer,
    BoxGeometry,
    LineBasicMaterial,
    Line,
    BufferGeometry,
    Vector3,
    Vector2,
    DataTexture3D,
    RepeatWrapping,
    AlphaFormat,
    RedFormat,
    RGFormat,
    RGBAFormat,
    RedIntegerFormat,
    RGIntegerFormat,
    LuminanceFormat,
    DepthFormat,
    DepthStencilFormat,
    FloatType,
    ShortType,
    HalfFloatType,
    ByteType,
    LinearFilter,
    UniformsUtils,
    TextureLoader,
    ShaderMaterial,
    BackSide,
    BoxBufferGeometry,
    Mesh,
    MeshBasicMaterial
} from './node_modules/three/build/three.module.js';

import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { NRRDLoader } from './node_modules/three/examples/jsm/loaders/NRRDLoader.js';
import { ShaderLoader } from './ShaderLoader.js';

export async function run() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new Scene();
    scene.background = new Color(0xff0000);

    const viewSize = 256;
    const camera = createCamera(scene, width, height / 2, viewSize);
    const observerCamera = createCamera(scene, width, height / 2, viewSize / 2);
    observerCamera.near = 1;
    observerCamera.far = 4000;
    observerCamera.position.set(0, 10, 0);
    observerCamera.lookAt(0, 0, 0);

    const cameraHelper = new CameraHelper(camera);
    scene.add(cameraHelper);

    fillSceneWithCustomData(scene);

    const view = new View();
    const renderer = new WebGLRenderer({canvas: view.canvas});
    renderer.setSize(width, height);

    const renderContext = new RenderContext(
        view,
        scene,
        camera,
        observerCamera,
        cameraHelper,
        renderer);
    const renderCall = render.bind(renderContext);

    const cameraOrbitControl = createOrbitControls(camera, view.bottomElement, renderCall);
    const observerOrbitalControl = createOrbitControls(
        observerCamera,
        view.topElement,
        renderCall);


    const dataLoader = new NRRDLoader();
    console.log("Trying to load the data...");
    let volume = await loadAsync(
        dataLoader, 
        'assets/models/seed.nrrd',
        notifyProgress.bind(renderContext))
        .catch((error) => errorOnFileLoad.call(renderContext));

    if (true)
    {
        volume = createCustomVolume();
    }

    if(volume)
    {
        console.log("Data loaded!");
        await processData(renderContext, volume);
    }

    renderCall();
}

async function loadAsync(loader, path, progressCallback) {
    return new Promise((resolve, reject) => {
        loader.load(
            path,
            (successResponse) => {
                resolve(successResponse);
            },
            progressCallback,
            (errorResponse) => {
                reject(errorResponse);
            });
    });
}

function fillSceneWithCustomData(scene) {

    const geometry = new BoxGeometry(10, 10, 10);
    const material = new MeshBasicMaterial( { color: 0x00ff00 });

    const pivot = new Mesh(geometry, material);
    addAxes(pivot);

    const offset = 50;
    const scale = 9;

    const xCube = new Mesh(geometry, material);
    xCube.position.x += offset;
    addAxes(xCube);
    xCube.scale.set(scale, 1, 1);

    const yCube = new Mesh(geometry, material);
    yCube.position.y += offset;
    addAxes(yCube);
    yCube.scale.set(1, scale, 1);

    const zCube = new Mesh(geometry, material);
    zCube.position.z += offset;
    addAxes(zCube);
    zCube.scale.set(1, 1, scale);

    const group = new Group();
    group.add(pivot);
    group.add(xCube);
    group.add(yCube);
    group.add(zCube);

    scene.add(group);
}

function addAxes(object) {
    const axes = new AxesHelper(10);
    axes.renderOrder = 1;
    axes.material.depthTest = false;
    object.add(axes);
}

function createCamera(scene, width, height, size) {
    const aspectRatio = width / height;
    const near = 10;
    const far = 1000;
    const right = aspectRatio * size / 2;
    const left = -right;
    const top = size / 2;
    const bottom = -top;
    const camera = new OrthographicCamera(left, right, top, bottom, near, far);

    camera.position.set(0, 0, 128);
    camera.up.set(0, 0, 1);

    return camera;
}

function createCustomVolume() {
    const size = 30;
    const xLength = size;
    const yLength = size;
    const zLength = size;

    const data = new Float32Array(xLength * yLength * zLength);
    for(let xIndex = 0; xIndex < xLength; xIndex++) {
        for(let yIndex = 0; yIndex < yLength; yIndex++) {
            for(let zIndex = 0; zIndex < zLength; zIndex++) {
                const value = xIndex / (xLength - 1);
                data[xIndex * xLength + yIndex * yLength + zIndex] = value;
            }
        }
    }
    
    return {
        xLength: xLength,
        yLength: yLength,
        zLength: zLength,
        data: data
    };
}

async function processData(renderContext, volume) {
    const texture = new DataTexture3D(
        volume.data,
        volume.xLength,
        volume.yLength,
        volume.zLength);
    texture.type = FloatType;
    texture.format = RedFormat;
    texture.minFilter = texture.magFilter = LinearFilter;
    texture.unpackAlignment = 1;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;

    const textureLoader = new TextureLoader();
    const viridis = await loadAsync(
        textureLoader,
        "assets/textures/cm_viridis.png",
        notifyProgress.bind(renderContext))
        .catch((error) => errorOnFileLoad(renderContext, error));
    const gray = await loadAsync(
        textureLoader,
        "assets/textures/cm_gray.png",
        notifyProgress.bind(renderContext))
        .catch((error) => errorOnFileLoad(renderContext, error));

    if (!(viridis && gray))
    {
        return;
    }
    const colormapTextures = {
        viridis: viridis,
        gray: gray
    };

    const colormap = 'viridis';

    console.log("Loading shaders...");
    const shaderLoader = new ShaderLoader();
    const vertexShader = await loadAsync(
        shaderLoader,
        "js/shaders/volumeshader_vs.glsl",
        notifyProgress.bind(renderContext))
        .catch((error) => errorOnFileLoad(renderContext, error));
    if (vertexShader) {
        console.log("vertex shader loaded!");
    }
    const fragmentShader = await loadAsync(
        shaderLoader,
        "js/shaders/volumeshader_fs.glsl",
        notifyProgress.bind(renderContext))
        .catch((error) => errorOnFileLoad(renderContext, error));
    if (fragmentShader) {
        console.log("fragment shader loaded!");
    }

    const uniforms = {
        "u_size": { value: new Vector3( 1, 1, 1 ) },
        "u_renderstyle": { value: 0 },
        "u_renderthreshold": { value: 0.5 },
        "u_clim": { value: new Vector2( 1, 1 ) },
        "u_data": { value: null },
        "u_cmdata": { value: null }
    };

    uniforms["u_data"].value = texture;
    uniforms["u_size"].value.set(volume.xLength, volume.yLength, volume.zLength);
    uniforms["u_clim"].value.set(0, 1);
    uniforms["u_renderstyle"].value = 0;
    uniforms["u_renderthreshold"].value = 0.15;
    uniforms["u_cmdata"].value = colormapTextures[colormap];

    const material = new ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: BackSide,
        wireframe: false
    });

    const geometry = new BoxBufferGeometry(volume.xLength, volume.yLength, volume.zLength);
    geometry.translate(
        volume.xLength,
        volume.yLength,
        volume.zLength);
    //geometry.translate(0, 0, 0);
    const mesh = new Mesh(geometry, material);
    renderContext.scene.add(mesh);
}

function notifyProgress(progress) {
    console.log('loaded ' + progress.loaded / progress.total);
}

function errorOnFileLoad(renderContext, error) {
    console.error(error);
}

function View() {
    this.canvas = document.querySelector('#main');
    this.topElement = document.querySelector('#top');
    this.bottomElement = document.querySelector('#bottom');
}

function RenderContext(view, scene, camera, observerCamera, cameraHelper, renderer) {
    this.view = view;
    this.scene = scene;
    this.camera = camera;
    this.observerCamera = observerCamera;
    this.cameraHelper = cameraHelper;
    this.renderer = renderer;
}

function createOrbitControls(camera, element, renderCall) {
    const orbitControls = new OrbitControls(camera, element);
    orbitControls.addEventListener('change', renderCall);
    orbitControls.minZoom = 0.1;
    orbitControls.maxZoom = 4.0;
    orbitControls.update();
    return orbitControls;
}

function setScissorForElement(element) {
    const canvasRectangle = this.view.canvas.getBoundingClientRect();
    const elementRectangle = element.getBoundingClientRect();

    const right = Math.min(elementRectangle.right, canvasRectangle.right) - canvasRectangle.left;
    const left = Math.max(0, elementRectangle.left - canvasRectangle.left);
    const bottom = Math.min(elementRectangle.bottom, canvasRectangle.bottom) - canvasRectangle.top;
    const top = Math.max(0, elementRectangle.top - canvasRectangle.top);

    const width = Math.min(canvasRectangle.width, right - left);
    const height = Math.min(canvasRectangle.height, bottom - top);

    const positiveYUpBottom = canvasRectangle.height - bottom;
    this.renderer.setScissor(left, positiveYUpBottom, width, height);
    this.renderer.setViewport(left, positiveYUpBottom, width, height);

    return width / height;
}

function render() {
    console.log("Rendering...");

    this.renderer.setScissorTest(true);

    {
        this.cameraHelper.visile = false;
        const aspect = setScissorForElement.call(this, this.view.topElement);
        this.observerCamera.aspect = aspect;
        this.observerCamera.updateProjectionMatrix();
        this.cameraHelper.visible = true;
        this.scene.background.set(0x000000);
        this.renderer.render(this.scene, this.observerCamera);
    }

    {
        this.cameraHelper.visile = true;
        const aspect = setScissorForElement.call(this, this.view.bottomElement);
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
        this.cameraHelper.update();
        this.cameraHelper.visible = false;
        this.scene.background.set(0x000050);
        this.renderer.render(this.scene, this.camera);
    }
}
