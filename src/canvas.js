import {
  Post,
  Renderer,
  Camera,
  Program,
  Plane,
  Transform,
  Texture,
  Mesh,
} from "ogl";
import { basicFrag } from "./shaders/BasicFrag";
import { N } from "./utils/namhai";
import basicVer from "./shaders/BasicVer.glsl?raw";
import FluidPass from "./FluidPass";
import PostProcessor from "./PostProcessor";
import BloomPass from "./BloomPass";
import FXAAPass from "./FXAAPass";
import DitheringPass from "./DitheringPass";
import ColorMapMono from "./ColorMapMono";

export default class Canvas {
  constructor() {
    this.renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: devicePixelRatio,
    });
    this.gl = this.renderer.gl;
    document.body.appendChild(this.gl.canvas);
    console.log("canvas");

    this.camera = new Camera(this.gl);
    this.camera.position.z = 5;

    this.scene = new Transform();

    this.onResize();

    N.BM(this, ["update", "onResize", "onScroll"]);

    this.raf = new N.RafR(this.update);
    this.ro = new N.ROR(this.onResize);

    this.fluidPass = new FluidPass(this.gl, {
      densityDissipation: 0.92,
    });

    // this.bloomPass = new BloomPass(this.gl);
    this.post = new PostProcessor(this.gl);
    this.post
      // .addPassEffect(new DitheringPass(this.gl, {dpr: 0.1}))
      .addPassEffect(new ColorMapMono({
        color: {
          start:'#F21B3F',
          end:'#08BDBD'
        },
        threshold: {
          start: 0.12,
          end: 0.6
        }
      }))
      // .addPassEffect(new BloomPass(this.gl, {iteration: 20,bloomStrength: 2, threshold: 0.6}))
      .addPassEffect(this.fluidPass)
      // .addPassEffect(new FXAAPass)

    this.mesh = this.createMedia("2.jpg", 800);
    this.mesh.setParent(this.scene);

    this.init();
    this.addEventListener();
  }
  async init() {
    this.raf.run();
    this.ro.on();
  }
  addEventListener() {
    // document.addEventListener('wheel', this.onScroll)
  }

  onScroll(e) {
    this.scroll.target += e.deltaY / 100;
  }

  onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.sizePixel = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    this.camera.perspective({
      aspect: this.sizePixel.width / this.sizePixel.height,
    });
    const fov = (this.camera.fov * Math.PI) / 180;

    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    this.size = {
      height: height,
      width: height * this.camera.aspect,
    };

    this.post && this.post.resize({ width: this.sizePixel.width, height: this.sizePixel.height});
  }

  update(t) {
    // if(this.video && this.video.readyState >= this.video.HAVE_CURRENT_DATA){
    //   if(!this.videoTexture.value.image) this.videoTexture.value.image = this.video
    //   this.videoTexture.value.needsUpdate = true
    // }

    // this.mesh.rotation.z = t.elapsed / 2000;

    this.post.render({
      scene: this.scene,
      camera: this.camera,
    });
  }

  createMedia(src, w, h = w) {
    let image = new Image();
    let texture = new Texture(this.gl);
    image.crossOrigin = "anonymous";
    image.onload = () => {
      texture.image = image;
    };
    image.src = src;

    let geometry = new Plane(this.gl);
    let program = new Program(this.gl, {
      fragment: basicFrag,
      vertex: basicVer,
      uniforms: {
        tMap: { value: texture },
      },
      cullFace: null,
    });

    let mesh = new Mesh(this.gl, { geometry, program });
    let width = (this.size.width * w) / this.sizePixel.width;
    let height = (this.size.width * h) / this.sizePixel.width;
    mesh.scale.set(width, height, width);
    return mesh;
  }
}

const fragment = /* glsl */ `
  precision highp float;

  uniform sampler2D tMap;
  uniform sampler2D tFluid;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
      vec3 fluid = texture2D(tFluid, vUv).rgb;
      vec2 uv = vUv - fluid.rg * 0.0002;

      gl_FragColor = texture2D(tMap, uv);

      // Oscillate between fluid values and the distorted scene
      // gl_FragColor = mix(texture2D(tMap, uv), vec4(fluid * 0.1 + 0.5, 1), smoothstep(0.0, 0.7, sin(uTime)));
  }
`;
