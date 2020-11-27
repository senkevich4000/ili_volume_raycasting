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

var RenderStyle = {
    raycast : 0,
    steps_debug: 1
};
Object.freeze(RenderStyle);

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
    const shapeVolume = await loadAsync(
        dataLoader, 
        'assets/models/stent.nrrd',
        notifyProgress.bind(renderContext))
        .catch((error) => errorOnFileLoad.call(renderContext));
    const intensityVolume = createIntensityVolume(
        shapeVolume.xLength,
        shapeVolume.yLength,
        shapeVolume.zLength);

    if(shapeVolume && intensityVolume)
    {
        console.log("Data loaded!");
        await processData(renderContext, shapeVolume, intensityVolume);
    }

    renderCall();
}

function cameraFollowObject(camera, object, offset) {
    const cameraPosition = object.position + offset;
    camera.position.set(offset);
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

    const redMaterial = new MeshBasicMaterial( { color: 0xff0000 });
    const greenMaterial = new MeshBasicMaterial( { color: 0x00ff00 });
    const blueMaterial = new MeshBasicMaterial( { color: 0x0000ff });

    const offset = 50;
    const scale = 50;

    const xCube = new Mesh(geometry, redMaterial);
    xCube.position.x += offset;
    addAxes(xCube);
    xCube.scale.set(scale, 1, 1);

    const yCube = new Mesh(geometry, greenMaterial);
    yCube.position.y += offset;
    addAxes(yCube);
    yCube.scale.set(1, scale, 1);

    const zCube = new Mesh(geometry, blueMaterial);
    zCube.position.z += offset;
    addAxes(zCube);
    zCube.scale.set(1, 1, scale);

    const group = new Group();
    group.add(xCube);
    group.add(yCube);
    group.add(zCube);

    group.position.x -= 140;
    group.position.y -= 140;
    group.position.z -= 140;

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

function createIntensityVolume(xLength, yLength, zLength) {
    const data = new Float32Array(xLength * yLength * zLength);
    for(let xIndex = 0; xIndex < xLength; xIndex++) {
        for(let yIndex = 0; yIndex < yLength; yIndex++) {
            for(let zIndex = 0; zIndex < zLength; zIndex++) {
                const value = xIndex / (xLength - 1);
                data[zIndex + yLength * (yIndex + xLength * xIndex)] = value;
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

function createDefaultTextureFromVolume(volume) {
    const texture = new DataTexture3D(
        volume.data,
        volume.xLength,
        volume.yLength,
        volume.zLength);
    texture.type = FloatType;
    texture.format = RedFormat;
    texture.minFilter = texture.magFilter = LinearFilter;
    texture.unpackAlignment = 1;

    return texture;
}

function Bounds(volume) {
    this.min = volume.data
        .reduce((left, right) => left < right ? left : right);
    this.max = volume.data
        .reduce((left, right) => left > right ? left : right);

    return this;
}

Bounds.prototype.asVector = function () {
    return new Vector2(this.min, this.max);
}

async function processData(renderContext, shapeVolume, intensityVolume) {

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

    const colormap = 'gray';

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

    const shapeBounds = new Bounds(shapeVolume);
    const intensityBounds = new Bounds(intensityVolume);

    const shapeTexture = createDefaultTextureFromVolume(shapeVolume);
    const intensityTexture = createDefaultTextureFromVolume(intensityVolume);

    const shapeSize = new Vector3(
        shapeVolume.xLength,
        shapeVolume.yLength,
        shapeVolume.zLength);
    const intensitySize = new Vector3(
        intensityVolume.xLength,
        intensityVolume.yLength,
        intensityVolume.zLength);

    // add shading (true/false) as int.
    const uniforms = {

        u_shape_size: { value: shapeSize },
        u_shape_data: { value: shapeTexture },
        u_shape_bounds: { value: shapeBounds.asVector() },

        u_intensity_size: { value: intensitySize },
        u_intensity_data: { value: intensityTexture },
        u_intensity_bounds: { value: shapeBounds.asVector() },

        u_renderstyle: { value: RenderStyle.raycast },
        u_renderthreshold: { value: 0.15 },
        u_clim: { value: new Vector2(0, 1 ) },

        u_cmdata: { value: colormapTextures[colormap] },
    };

    const material = new ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: BackSide,
    });

    const geometry = new BoxBufferGeometry(
        shapeVolume.xLength, 
        shapeVolume.yLength, 
        shapeVolume.zLength);
    geometry.translate(
        shapeVolume.xLength / 2 + 0.5,
        shapeVolume.yLength / 2 + 0.5,
        shapeVolume.zLength / 2 + 0.5);

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
    console.debug("Rendering...");

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
