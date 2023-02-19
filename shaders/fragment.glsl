uniform float uTime;
uniform sampler2D uTexture;
uniform vec3 uColor;

varying vec2 vUv;

void main(){
    vec4 ttt = texture2D(uTexture, vUv);
    gl_FragColor = vec4(uColor,ttt.r);
}