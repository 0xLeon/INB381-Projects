attribute vec4 vPosition;
attribute vec3 vNormal;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 normalMatrix;

uniform int mode;

varying vec4 fColor;
varying vec2 fSeed;

varying vec3 fNormalInterp;
varying vec3 fVertPos;

// helper function for "random" value generation
highp float rand(vec2 seed) {
	highp float a = 12.9898;
	highp float b = 78.233;
	highp float c = 43758.5453;
	
	highp float dt = dot(seed.xy, vec2(a, b));
	highp float sn = mod(dt, 3.14159265359);
	
	return fract(sin(sn) * c);
}

// bird rendering function
void renderBird(void) {
	vec4 vertPos = viewMatrix * vec4(vPosition.xyz, 1.0);
	
	gl_Position = projectionMatrix * vertPos;
	fVertPos = vec3(vertPos.xyz) / vertPos.w;
	
	highp float colorR = 0.7 * rand(vPosition.xy);
	highp float colorG = 0.7 * rand(vPosition.xz);
	highp float colorB = 0.7 * rand(vPosition.yz);
	
	fColor = vec4(colorR, colorG, colorB, 1.0);
	fSeed = vec2(vPosition.xy);
}

// ground rendering function
void renderFloor(void) {
	vec4 vertPos =  viewMatrix * vec4(vPosition.x, vPosition.y - 10.0, vPosition.z, 1.0);
	
	gl_Position = projectionMatrix * vertPos;
	fVertPos = vec3(vertPos.xyz) / vertPos.w;
	
	highp float colorR = 0.7 * rand(vPosition.xy);
	highp float colorG = 0.7 * rand(vPosition.xz);
	highp float colorB = 0.7 * rand(vPosition.yz);
	
	fColor = vec4(colorR, colorG, colorB, 1.0);
	fSeed = vec2(vPosition.xy);
}

void main() {
	if (0 == mode) {
		renderBird();
	}
	else if (1 == mode) {
		renderFloor();
	}
	
	// calculate normal for lighting
	fNormalInterp = vec3((normalMatrix * vec4(vNormal, 0.0)));
}
