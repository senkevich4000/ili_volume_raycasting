define(
    [],
    function() {
      function getUniforms(
          shapeSize,
          shapeTexture,
          shapeColormap,
          shapeBounds,
          intensityMapSize,
          intensityMapTexture,
          intensityMapColormap,
          intensityMapBounds,
          normalsMapSize,
          normalsMapTexture,
          settings) {
        return {
          u_shape_size: {value: shapeSize},
          u_shape_data: {value: shapeTexture},
          u_shape_cmdata: {value: shapeColormap},
          u_shape_bounds: {value: shapeBounds},

          u_intensity_size: {value: intensityMapSize},
          u_intensity_data: {value: intensityMapTexture},
          u_intensity_cmdata: {value: intensityMapColormap},
          u_intensity_bounds: {value: intensityMapBounds},

          u_normals_size: {value: normalsMapSize},
          u_normals_data: {value: normalsMapTexture},

          u_ambient_intensity: {value: 0.3},
          u_diffuse_intensity: {value: 0.6},
          u_specular_intensity: {value: 0.3},
          u_rim_intensity: {value: 0.0},

          u_renderstyle: {value: settings.renderStyle},

          u_relative_step_size: {value: settings.relativeStepSize},
          uniformal_opacity: {value: settings.uniformalOpacity},
          uniformal_step_opacity: {value: settings.uniformalStepOpacity},

          u_proportional_opacity_enabled: {value: settings.proportionalOpacityEnabled},
          u_lighting_enabled: {value: settings.lightingEnabled},

          u_scalemode: {value: settings.scaleMode},
        };
      }

      return {getUniforms};
    },
);
