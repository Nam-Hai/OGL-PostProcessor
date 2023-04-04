import { Color } from 'ogl'
export default class ColorMapMono {
    constructor({enabled = true, color= {start: '#ffffff', end: '#000000'}, threshold= {start: 0, end : 1}} = {}){
        this.size = {
            width: innerWidth,
            height: innerHeight,
        };
        this.enabled = enabled
        this.start = {
            color: new Color(color.start),
            threshold: threshold.start
        } 
        this.end = {
            color: new Color(color.end),
            threshold: threshold.end
        }
        console.log(this.start, color);
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
                uColorStart: {value: this.start.color},
                uColorEnd: {value: this.end.color},
                uThresholdStart: {value: this.start.threshold},
                uThresholdEnd: {value: this.end.threshold}
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
    uniform vec3 uColorStart;
    uniform vec3 uColorEnd;
    uniform float uThresholdStart;
    uniform float uThresholdEnd;

    in vec2 vUv;
    out vec4 glColor;

    float luma(vec3 color) {
        return dot(color, vec3(0.299, 0.587, 0.114));
    }
    float ilerp(float x,float xi,float xf) {
        return (x - xi) / (xf - xi);
    }

    void main() {
        vec4 tex = texture(tMap, vUv);

        float grey = luma(vec3(tex));
        grey = ilerp(grey, uThresholdStart, uThresholdEnd);
        grey = clamp(0.,grey, 1.);

        vec3 color = mix(uColorStart, uColorEnd, grey);
        glColor = vec4(color, 1.);
    }
`;

