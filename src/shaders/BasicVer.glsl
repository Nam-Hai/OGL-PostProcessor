#version 300 es
precision highp float;

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

in vec3 position;
in vec3 normal;
in vec2 uv;

out vec3 vN;
out vec2 vUv;
out vec3 vOPosition;
out vec3 vPosition;
out vec3 vNormal;

float io2(float x) {
  return x < 0.5 ? 2. * x * x : 1. - pow(-2. * x + 2., 2.) / 2.;
}

float io3(float x) {
  return x < 0.5 ? 4. * x * x * x : 1. - pow(-2. * x + 2., 3.) / 2.;
}

void main() {
  vUv = uv;
  vec3 pos = position;

  vec4 mvP = modelViewMatrix * vec4(pos, 1.);

  gl_Position = projectionMatrix * mvP;
}
