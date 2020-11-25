import {
    FileLoader,
    Loader
} from './node_modules/three/build/three.module.js';

var ShaderLoader = function (manager) {
    Loader.call(this, manager);
};

ShaderLoader.prototype = Object.assign(
    Object.create(Loader.prototype),
    {
        constructor: ShaderLoader,
        load: function (url, onLoad, onProgress, onError) {
            var loader = new FileLoader(this.manager);
            loader.setPath(this.path);
            loader.setRequestHeader(this.requestHeader);
            loader.setWithCredentials(this.withCredentials);
            loader.load(
                url, 
                function (data) {
                    try {
                        onLoad(data);
                    } catch (error) {
                        if(onError) {
                            onError(e);
                        } else {
                            console.error(error);
                        }
                    }
                },
                onProgress,
                onError);
        }
    });

export { ShaderLoader };
