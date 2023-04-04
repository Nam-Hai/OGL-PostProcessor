
import { shader as vignette } from './shaders/vignette'
import { shader as noise } from './shaders/noise'

export default class VignettePass {
    constructor({enabled = true, boost = 1.3, reduction = 1.2, noise = 0.1} = {}){
        this.noise = {value: noise}
        this.boost = {value: boost}
        this.reduction = {value: reduction}
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
                uBoost: this.boost,
                uReduction: this.reduction,
                uNoise: this.noise
            },
            beforePass: (e)=>{
                this.pass.uniforms.uTime.value = e.elapsed
            }
        })
        return {}
    }

}

const fragment = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D tMap;

uniform float uBoost;
uniform float uReduction;
uniform float uTime;
uniform float uNoise;

in vec2 vUv;

out vec4 fragColor;

${vignette}

${noise}

void main() {
//   vec4 color = texture(tMap, vUv);
//   fragColor = color;
//   fragColor *= vignette(vUv, uBoost, uReduction);
//   fragColor.a *= 0.9 * noise(gl_FragCoord.xy, uTime/10.);
//   fragColor.a = 1.;
  vec4 color = texture(tMap, vUv);
  fragColor = color;
  fragColor *= vignette(vUv, uBoost, uReduction);
  fragColor += uNoise * noise(gl_FragCoord.xy, uTime/40.);
  fragColor.a = 1.;
}
`;