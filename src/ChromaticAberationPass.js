import { shader as noise } from './shaders/noise'
import { shader as chromaticAberration } from './shaders/chromatic-aberration'

export default class ChromaticAberration {
    constructor({enabled = true, uZoom = 0.1, uUnZoom = 1/(1+uZoom), noise = 0.08} = {}){
        this.uNoise = {value: noise}
        this.uZoom = {value: uZoom}
        this.uUnZoom = {value: uUnZoom}
        console.log(this.uZoom, this.uUnZoom);
        this.size = {
            width: innerWidth,
            height: innerHeight,
        };
        this.enabled = enabled
    }

    toggleEffect(){
        this.enabled = !this.enabled
        this.pass.enabled = this.enabled
    }
    addPassRef(addPass){
        this.pass = addPass({
            fragment,
            enabled: this.enabled,
            uniforms: {
                uTime: {value: 0},
                uZoom: this.uZoom,
                uUnZoom: this.uUnZoom,
                uNoise: this.uNoise
            },
            beforePass: (e)=>{
                this.pass.uniforms.uTime.value = e.elapsed
            }
        })

        return {resizeCallback: this.resize.bind(this)}
    }

    resize({width, height}){
        this.size.width = width
        this.size.height = height
    }
}


const fragment = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D tMap;
uniform float uTime;
uniform float uZoom;
uniform float uUnZoom;
uniform float uNoise;

in vec2 vUv;

out vec4 fragColor;

${chromaticAberration}
${noise}

void main() {
  vec2 uv = uUnZoom * (vUv - .5) + .5;
  fragColor = chromaticAberration(tMap, uv,  uZoom, (vUv - .5));

  fragColor += uNoise * noise(gl_FragCoord.xy, uTime / 10.);
  fragColor.a = 1.;
} `;