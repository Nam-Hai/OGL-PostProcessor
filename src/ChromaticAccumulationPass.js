import { shader as vignette } from './shaders/vignette'
import { shader as noise } from './shaders/noise'

export default class ChromaticAccumulationPass {
    constructor({enabled = true, iteration = 10, noise= 0.09, direction = 20} = {}){
        this.iteration = {value: iteration}
        this.direction = {value: direction}

        this.noise = {value: noise}
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
                uIteration: this.iteration,
                uNoise: this.noise,
                uDirection: this.direction
            },
            beforePass: (e)=>{
                this.pass.uniforms.uTime.value = e.elapsed
            }
        })
        return {}
    }

}

const fragment = /* glsl */`#version 300 es
precision highp float;

uniform sampler2D tMap;
uniform float uTime;
uniform float uNoise;
uniform int uIteration;
uniform float uDirection;

in vec2 vUv;

out vec4 fragColor;

${noise}

void main() {
  vec2 size = vec2(textureSize(tMap, 0));
  int steps = uIteration;
  float total = 0.;
  float fSteps = float(steps);
  vec4 accum = vec4(0.);
  for( int i = 0; i < steps; i++){
    vec2 inc = uDirection * float(i) / (fSteps*size);
    vec2 dir = vUv-.5;
    vec4 r = texture(tMap, vUv - dir * inc);
    vec4 g = texture(tMap, vUv);
    vec4 b = texture(tMap, vUv + dir * inc);
    float w = float(steps - i)/fSteps;
    accum += vec4(r.r, g.g, b.b, 0.) * w;
    total += w;
  }
  accum /= total;
  fragColor = vec4(accum.rgb , 1.);
  fragColor += uNoise * noise(gl_FragCoord.xy, uTime);
}`;