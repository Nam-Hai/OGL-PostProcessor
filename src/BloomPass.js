import PostProcessor from "./PostProcessor";
import { Program, Mesh, Vec2, Camera } from "ogl";

export default class BloomPass {
  constructor(gl, { enabled = true, iteration = 5, bloomStrength = 1, threshold = 0.8 , direction = {x: 2, y:2}} = {}) {
    this.gl = gl;
    this.size = {
      width: innerWidth,
      height: innerHeight,
    };
    this.directionY = {value: new Vec2(0, direction.y)}
    this.directionX = {value: new Vec2(direction.x, 0)}

    this.resolution = {value: new Vec2(this.size.width, this.size.height)}
    this.threshold = {value : threshold}
    this.bloomStrength = { value: bloomStrength}
    this.camera = new Camera(this.gl, {
      left: -this.size.width / 2,
      right: this.size.width / 2,
      top: this.size.height / 2,
      bottom: -this.size.height / 2,
    });
    this.enabled = enabled

    this.postBloom = new PostProcessor(gl, { dpr: 0.5, targetOnly: true });
    this.bloomResolution = {value : new Vec2(this.postBloom.options.width, this.postBloom.options.height)}

    const brightPass = this.postBloom.addPass({
      fragment: brightPassFragment,
      uniforms: {
        uThreshold: this.threshold
      },
    });
    // Add gaussian blur passes
    const horizontalPass = this.postBloom.addPass({
      fragment: blurFragment,
      uniforms: {
        uResolution: this.bloomResolution,
        uDirection: this.directionX,
      },
    });
    const verticalPass = this.postBloom.addPass({
      fragment: blurFragment,
      uniforms: {
        uResolution: this.bloomResolution,
        uDirection: this.directionY,
      },
    });
    // Re-add the gaussian blur passes several times to the array to get smoother results
    for (let i = 0; i < iteration; i++) {
      console.log('test')
      this.postBloom.passes.push(horizontalPass, verticalPass);
    }
  }

  toggleEffect(){
    this.enabled = !this.enabled
    this.pass.enabled = this.enabled
  }

  addPassRef(addPass) {

    this.pass = addPass({
      fragment: compositeFragment,
      uniforms: {
        uResolution: this.resolution,
        tBloom: {value: null},
        uBloomStrength: this.bloomStrength,
      },
      enabled: this.enabled,
      textureUniform: 'tMap',
      beforePass: (e,{scene, camera, texture})=> {
        this.postBloom.render(e,{texture})
        this.pass.program.uniforms.tBloom.value = this.postBloom.uniform.value
      }
    })
    return {resizeCallback: this.resize.bind(this)}
  }

  resize({ width, height }) {
    this.size = { width, height };
    this.camera.left = -this.size.width / 2;
    this.camera.right = this.size.width / 2;
    this.camera.top = this.size.height / 2;
    this.camera.bottom = -this.size.height / 2;
    this.camera.updateMatrixWorld();

    this.resolution = {value: new Vec2(this.size.width, this.size.height)}
    this.bloomResolution.value.set(this.postBloom.options.width, this.postBloom.options.height);
  }
}

const brightPassFragment = /* glsl */ `#version 300 es
    precision highp float;
    uniform sampler2D tMap;
    uniform float uThreshold;

    in vec2 vUv;
    out vec4 color;

    void main() {
        vec4 tex = texture(tMap, vUv);
        vec4 bright = tex * step(uThreshold, length(tex.rgb) / 1.73205);
        color = bright;
    }
`;

const blurFragment = /* glsl */ `#version 300 es
    precision highp float;

    // https://github.com/Jam3/glsl-fast-gaussian-blur/blob/master/5.glsl
    vec4 blur5(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
        vec4 color = vec4(0.0);
        vec2 off1 = vec2(1.3333333333333333) * direction;
        color += texture(image, uv) * 0.29411764705882354;
        color += texture(image, uv + (off1 / resolution)) * 0.35294117647058826;
        color += texture(image, uv - (off1 / resolution)) * 0.35294117647058826;
        return color;
    }

    // https://github.com/Jam3/glsl-fast-gaussian-blur/blob/master/9.glsl
    vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
        vec4 color = vec4(0.0);
        vec2 off1 = vec2(1.3846153846) * direction;
        vec2 off2 = vec2(3.2307692308) * direction;
        color += texture(image, uv) * 0.2270270270;
        color += texture(image, uv + (off1 / resolution)) * 0.3162162162;
        color += texture(image, uv - (off1 / resolution)) * 0.3162162162;
        color += texture(image, uv + (off2 / resolution)) * 0.0702702703;
        color += texture(image, uv - (off2 / resolution)) * 0.0702702703;
        return color;
    }

    uniform sampler2D tMap;
    uniform vec2 uDirection;
    uniform vec2 uResolution;

    in vec2 vUv;

    out vec4 color;
    void main() {
        // Swap with blur9 for higher quality
        vec4 b9 = blur9(tMap, vUv, uResolution, uDirection);
        // vec4 b5 = blur5(tMap, vUv, uResolution, uDirection);
        // color = mix(b9, b5, step(vUv.x, 0.5));
        color = b9;
    }
`;

const compositeFragment = /* glsl */ `#version 300 es
  precision highp float;

  uniform sampler2D tMap;
  uniform sampler2D tBloom;
  uniform vec2 uResolution;
  uniform float uBloomStrength;

  in vec2 vUv;
  out vec4 color;

  void main() {
    color = texture(tMap, vUv) + texture(tBloom, vUv) * uBloomStrength;
  }
`;
