precision mediump float;

uniform int doLighting;

varying vec4 fColor;
varying vec2 fSeed;

varying vec3 fNormalInterp;
varying vec3 fVertPos;

const vec3 lightPos = vec3(0.0, 10.0, 0.0);
const vec3 diffuseColor = vec3(0.5, 0.5, 0.5);
const vec3 specColor = vec3(1.0, 1.0, 1.0);

highp float rand(vec2 seed) {
	highp float a = 12.9898;
	highp float b = 78.233;
	highp float c = 43758.5453;
	
	highp float dt = dot(seed.xy, vec2(a, b));
	highp float sn = mod(dt, 3.14159265359);
	
	return fract(sin(sn) * c);
}

void main() {
	if (1 == doLighting) {
		vec3 normal = normalize(fNormalInterp); 
		vec3 lightDir = normalize(lightPos - fVertPos);
		
		float lambertian = max(dot(lightDir, normal), 0.0);
		float specular = 0.0;
		
		if (lambertian > 0.0) {
			vec3 reflectDir = reflect(-lightDir, normal);
			vec3 viewDir = normalize(-fVertPos);
			
			float specAngle = max(dot(reflectDir, viewDir), 0.0);
			specular = pow(specAngle, 4.0);
			
			// different shininess
			// specular = pow(specAngle, 16.0);
			
			// rendering functions says this multiplication is necessary
			// has little to no effect on the output
			// specular *= lambertian;
			
			// turn off specular
			// specular *= 0.0;
		}
		
		gl_FragColor = vec4(lambertian * diffuseColor + specular * specColor, 1.0);
	}
	else {
		// highp float color = rand(fSeed);
		// gl_FragColor = vec4(color, color, color, 1.0);
		
		gl_FragColor = fColor;
	}
}
