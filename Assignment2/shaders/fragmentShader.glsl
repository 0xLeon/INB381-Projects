precision mediump float;

varying vec4 fColor;
varying vec2 fSeed;

highp float rand(vec2 seed) {
	highp float a = 12.9898;
	highp float b = 78.233;
	highp float c = 43758.5453;
	
	highp float dt = dot(seed.xy, vec2(a, b));
	highp float sn = mod(dt, 3.14159265359);
	
	return fract(sin(sn) * c);
}

void main() {
	// highp float color = rand(fSeed);
	gl_FragColor = fColor;
}
