define(
    [
      'three',
      'orbitControls',
      'dataLoader',
      'nrrdLoader',
      'shaderLoader',
      'volumeUtils',
      'uniforms',
      'lib',
      'constants',
      'cuboidsReader',
      'dicomReader',
    ],
    function(
        three,
        OrbitControls,
        DataLoader,
        NRRDLoader,
        ShaderLoader,
        VolumeUtils,
        Uniforms,
        lib,
        constants,
        CuboidsReader,
        DicomReader) {
      const useDemoData = true;
      async function run() {

        const width = window.innerWidth;
        const height = window.innerHeight;

        const scene = new three.Scene();
        scene.background = new three.Color(constants.MainCameraBackgroundColor);

        const dataWidth = 128;
        const dataHeight = 128;
        const dataDepth = 256;
        const dataMax = Math.max(Math.max(dataWidth, dataHeight), dataDepth);

        const camera = createCamera(dataMax);

        const view = new View();
        const renderer = new three.WebGLRenderer({canvas: view.canvas});
        renderer.setSize(width, height);

        const settings = new lib.VolumeRenderingSettings();
        const renderContext = new RenderContext(
            settings,
            view,
            scene,
            camera,
            renderer,
            dataMax);
        const renderCall = render.bind(renderContext);

        await createOrbitControls(camera, view.bottomElement, renderCall);

        console.log('Trying to load the data...');
        const nrrdLoader = await NRRDLoader
            .then((LoaderConstructor) => new LoaderConstructor());
        let shapeVolume = undefined;
        if (useDemoData) {
          shapeVolume = await loadAsync(
              nrrdLoader,
              './assets/models/stent.nrrd',
              notifyProgress.bind(renderContext))
            .catch((error) => consle.error(error));
        } else {
          shapeVolume = await DicomReader.fetchVolumeFromDicom(
              'readAllFiles/LUNG_MAP_D187_25/2')
            .catch((error) => console.error('Dicom read error:', error));
        }
        if (shapeVolume) {
          shapeVolume = {
            xLength: shapeVolume.xLength,
            yLength: shapeVolume.yLength,
            zLength: shapeVolume.zLength,
            data: Float32Array.from(shapeVolume.data),
          };
          console.log('Shape volume', shapeVolume);
          console.info('Data loaded!');
          await processData(renderContext, renderCall, shapeVolume);
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

      function createCamera(dimension) {
        const camera = new three.OrthographicCamera();
        camera.position.set(0, 0, dimension * 2);
        camera.up.set(0, 0, 1);
        return camera;
      }

      function updateOrthoCamera(camera, dimension, aspect) {
        const near = 10;
        const far = 1000;
        const right = dimension / 2 * aspect;
        const left = -right;
        const top = dimension / 2;
        const bottom = -top;

        camera.left = left;
        camera.right = right;
        camera.top = top;
        camera.bottom = bottom;
        camera.near = near;
        camera.far = far;
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
      }

      function createDefaultTextureFromVolume(volume) {
        return createTextureFromVolume(volume, three.FloatType, three.RedFormat);
      }

      function createTextureFromVolume(volume, type, format) {
        const texture = new three.DataTexture3D(
            volume.data,
            volume.xLength,
            volume.yLength,
            volume.zLength);
        texture.type = type;
        texture.format = format;
        texture.minFilter = texture.magFilter = three.LinearFilter;
        texture.unpackAlignment = 1;

        return texture;
      }

      async function processData(renderContext, renderCall, shapeVolume) {
        const textureLoader = new three.TextureLoader();
        const viridis = await loadAsync(
            textureLoader,
            renderContext.settings.intensityColormapName,
            notifyProgress.bind(renderContext))
            .catch((error) => errorOnFileLoad(renderContext, error));
        const gray = await loadAsync(
            textureLoader,
            renderContext.settings.shapeColormapName,
            notifyProgress.bind(renderContext))
            .catch((error) => errorOnFileLoad(renderContext, error));

        if (!(viridis && gray)) {
          return;
        }

        console.log('Loading shaders...');
        const shaderLoader = new ShaderLoader.ShaderLoader();
        const vertexShader = await loadAsync(
            shaderLoader,
            constants.PathToVertexShader,
            notifyProgress.bind(renderContext))
            .catch((error) => errorOnFileLoad(renderContext, error));
        if (vertexShader) {
          console.log('vertex shader loaded!');
        }
        const fragmentShader = await loadAsync(
            shaderLoader,
            constants.PathToFragmentShader,
            notifyProgress.bind(renderContext))
            .catch((error) => errorOnFileLoad(renderContext, error));
        if (fragmentShader) {
          console.log('fragment shader loaded!');
        }

        const shapeBounds = lib.Bounds.fromArray(shapeVolume.data);
        console.log('Shape bounds:', shapeBounds);
        const intensityBounds = new lib.Bounds(0, 1);
        const normalsBounds = new lib.Bounds(
            constants.Uint8MinValue,
            constants.Uint8MaxValue);

        const normalsMapCalculator = new VolumeUtils.NormalsMapCalculator(
            shapeVolume,
            normalsBounds);

        let cuboids = undefined;
        if (useDemoData) {
          cuboids = createCuboids(
              shapeVolume.xLength,
              shapeVolume.yLength,
              shapeVolume.zLength);
        } else {
          cuboids = await CuboidsReader.read('./assets/data/ili.csv')
              .catch((error) => console.error(error));
        }
        const moleculeIndex = 0;
        const intensityMapCalculator = new VolumeUtils.IntencityMapFromCuboidsCalculator(
            shapeVolume.xLength,
            shapeVolume.yLength,
            shapeVolume.zLength,
            shapeVolume.xLength,
            shapeVolume.yLength,
            shapeVolume.zLength,
            cuboids,
            moleculeIndex);
        const dataLoader = new DataLoader.DataLoader();
        dataLoader.registerJob(
            'js/workers/IntensityMapFactory.js',
            intensityMapCalculator,
            processIntensityMap.bind(this));
        dataLoader.registerJob(
            'js/workers/NormalsFactory.js',
            normalsMapCalculator,
            processNormalsMap.bind(this));

        const shapeTexture = createTextureFromVolume(
            shapeVolume,
            three.FloatType,
            three.RedFormat);

        const shapeSize = new three.Vector3(
            shapeVolume.xLength,
            shapeVolume.yLength,
            shapeVolume.zLength);
        const intensitySize = new three.Vector3(
            intensityMapCalculator.volume.xLength,
            intensityMapCalculator.volume.yLength,
            intensityMapCalculator.volume.zLength);
        const normalsSize = shapeSize;

        const uniforms = Uniforms.getUniforms(
            shapeSize,
            shapeTexture,
            gray,
            shapeBounds.asVector(),
            intensitySize,
            createDefaultTextureFromVolume(intensityMapCalculator.volume),
            viridis,
            intensityBounds.asVector(),
            normalsSize,
            createTextureFromVolume(
                normalsMapCalculator.volume,
                three.UnsignedByteType,
                three.RGBFormat),
            renderContext.settings);

        const material = new three.ShaderMaterial({
          uniforms: uniforms,
          vertexShader: vertexShader,
          fragmentShader: fragmentShader,
          side: three.BackSide,
          transparent: true,
        });

        const geometry = new three.BoxBufferGeometry(1, 1, 1);
        const translate = 0.5;
        geometry.translate(translate, translate, translate);
        geometry.scale(shapeSize.x, shapeSize.y, shapeSize.z);

        const mesh = new three.Mesh(geometry, material);
        mesh.position.x = -shapeSize.x / 2;
        mesh.position.y = -shapeSize.y / 2;
        mesh.position.z = -shapeSize.z / 2;

        renderContext.scene.add(mesh);
        renderCall();

        //dataLoader.start();

        function processIntensityMap(intensityVolume) {
          console.log('intensity map processed...');
          uniforms.u_intensity_data.value = createDefaultTextureFromVolume(
              intensityVolume);
          renderCall();
        }

        function processNormalsMap(normalsVolume) {
          console.log('normals map processed...');
          uniforms.u_normals_data.value = createTextureFromVolume(
              normalsVolume,
              three.UnsignedByteType,
              three.RGBFormat);
          renderCall();
        }
      }

      function notifyProgress(progress) {
        console.log('loaded ' + progress.loaded / progress.total);
      }

      function errorOnFileLoad(renderContext, error) {
        console.error(error, renderContext);
      }

      function View() {
        this.canvas = document.querySelector('#main');
        this.topElement = document.querySelector('#top');
        this.bottomElement = document.querySelector('#bottom');
      }

      function RenderContext(settings, view, scene, camera, renderer, maxDimension) {
        this.settings = settings;
        this.view = view;
        this.scene = scene;
        this.camera = camera;
        this.maxDimension = maxDimension;
        this.renderer = renderer;
      }

      async function createOrbitControls(camera, element, renderCall) {
        const orbitControls = await OrbitControls
            .then((ControlConstructor) => new ControlConstructor(camera, element));
        orbitControls.addEventListener('change', renderCall);
        orbitControls.minZoom = 0.1;
        orbitControls.maxZoom = 4.0;
        orbitControls.update();
        return orbitControls;
      }

      function createCuboids(xLength, yLength, zLength) {
        const xOffset = xLength / 2;
        const yOffset = yLength / 2;
        const zOffset = zLength / 2;

        const cuboids = []

        const full = false;
        if (full) {
            const fullVolumeCuboid = new CuboidsReader.Cuboid(
              xOffset,
              yOffset,
              zOffset,
              xLength,
              yLength,
              zLength);
          fullVolumeCuboid.molecules.push(new CuboidsReader.Molecule('m1', 1));
          cuboids.push(fullVolumeCuboid);
        } else {
          const cuboid1 = new CuboidsReader.Cuboid(
              '1a',
              xOffset / 2,
              yOffset / 2,
              zOffset / 2,
              xOffset,
              yOffset,
              zOffset);
          cuboid1.molecules.push(new CuboidsReader.Molecule('m1', 0.75));
          const cuboid2 = new CuboidsReader.Cuboid(
              '1b',
              xLength - xOffset / 2,
              yLength - yOffset / 2,
              zOffset / 2,
              xOffset,
              yOffset,
              zOffset);
          cuboid2.molecules.push(new CuboidsReader.Molecule('m1', 0.5));
          const cuboid3 = new CuboidsReader.Cuboid(
              '1c',
              xOffset,
              yOffset,
              zLength - zOffset / 2,
              xLength / 2,
              yLength / 2,
              zOffset);
          cuboid3.molecules.push(new CuboidsReader.Molecule('m1', 1.0));
          cuboids.push(cuboid1);
          cuboids.push(cuboid2);
          cuboids.push(cuboid3);
        }
        return cuboids;
      }

      function setScissorForElement(element) {
        const canvasRectangle = this.view.canvas.getBoundingClientRect();
        const elementRectangle = element.getBoundingClientRect();

        const right = Math.min(elementRectangle.right, canvasRectangle.right) -
              canvasRectangle.left;
        const left = Math.max(0, elementRectangle.left - canvasRectangle.left);
        const bottom = Math.min(elementRectangle.bottom, canvasRectangle.bottom) -
              canvasRectangle.top;
        const top = Math.max(0, elementRectangle.top - canvasRectangle.top);

        const width = Math.min(canvasRectangle.width, right - left);
        const height = Math.min(canvasRectangle.height, bottom - top);

        const positiveYUpBottom = canvasRectangle.height - bottom;
        this.renderer.setViewport(left, positiveYUpBottom, width, height);

        return width / height;
      }

      function render() {
        console.log('render');
        const aspect = setScissorForElement.call(this, this.view.bottomElement);
        updateOrthoCamera(this.camera, this.maxDimension, aspect);
        this.scene.background.set(constants.MainCameraBackgroundColor);
        this.renderer.render(this.scene, this.camera);
      }

      run();
    },
);
