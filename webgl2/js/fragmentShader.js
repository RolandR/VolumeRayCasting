var fragmentShader = `#version 300 es

precision lowp float;
precision lowp int;
precision lowp sampler3D;

uniform sampler3D tex;
uniform sampler3D normals;
uniform sampler2D colorMap;

uniform mat4 transform;
uniform int depthSampleCount;
uniform float zScale;

uniform vec3 lightPosition;

//uniform vec4 opacitySettings;
// x: minLevel
// y: maxLevel
// z: lowNode
// w: highNode

in vec2 texCoord;
out vec4 color;

vec3 ambientLight = vec3(0.34, 0.32, 0.32);
vec3 directionalLight = vec3(0.5, 0.5, 0.5);

vec3 aabb[2] = vec3[2](
	vec3(0.0, 0.0, 0.0),
	vec3(1.0, 1.0, 1.0)
);

struct Ray {
    vec3 origin;
    vec3 direction;
    vec3 inv_direction;
    int sign[3];
};

Ray makeRay(vec3 origin, vec3 direction) {
    vec3 inv_direction = vec3(1.0) / direction;
    
    return Ray(
        origin,
        direction,
        inv_direction,
        int[3](
			((inv_direction.x < 0.0) ? 1 : 0),
			((inv_direction.y < 0.0) ? 1 : 0),
			((inv_direction.z < 0.0) ? 1 : 0)
		)
    );
}

/*
	From: https://github.com/hpicgs/cgsee/wiki/Ray-Box-Intersection-on-the-GPU
*/
void intersect(
    in Ray ray, in vec3 aabb[2],
    out float tmin, out float tmax
){
    float tymin, tymax, tzmin, tzmax;
    tmin = (aabb[ray.sign[0]].x - ray.origin.x) * ray.inv_direction.x;
    tmax = (aabb[1-ray.sign[0]].x - ray.origin.x) * ray.inv_direction.x;
    tymin = (aabb[ray.sign[1]].y - ray.origin.y) * ray.inv_direction.y;
    tymax = (aabb[1-ray.sign[1]].y - ray.origin.y) * ray.inv_direction.y;
    tzmin = (aabb[ray.sign[2]].z - ray.origin.z) * ray.inv_direction.z;
    tzmax = (aabb[1-ray.sign[2]].z - ray.origin.z) * ray.inv_direction.z;
    tmin = max(max(tmin, tymin), tzmin);
    tmax = min(min(tmax, tymax), tzmax);
}

void main(){
	
	vec4 origin = vec4(texCoord, 0.0, 1.0);
	origin = transform * origin;
	origin = origin / origin.w;
	origin.z = origin.z / zScale;
	origin = origin + 0.5;

	vec4 direction = vec4(0.0, 0.0, 1.0, 1.0);
	direction = transform * direction;
	//direction = normalize(direction);

	Ray ray = makeRay(origin.xyz, direction.xyz);
	float tmin = 0.0;
	float tmax = 0.0;
	intersect(ray, aabb, tmin, tmax);

	vec4 value = vec4(0.0, 0.0, 0.0, 0.0);

	if(tmin > tmax){
		color = value;
		discard;
	}

	vec3 start = origin.xyz + tmin*direction.xyz;
	vec3 end = origin.xyz + tmax*direction.xyz;
	
	float length = length(end-start);
	int sampleCount = int(float(depthSampleCount)*length);
	//vec3 increment = (end-start)/float(sampleCount);
	//vec3 originOffset = mod((start-origin.xyz), increment);

	//vec3 directionalVector = normalize(lightPosition);


	float s = 0.0;
	float px = 0.0;
	vec4 pxColor = vec4(0.0, 0.0, 0.0, 0.0);
	vec3 texCo = vec3(0.0, 0.0, 0.0);
	vec3 normal = vec3(0.0, 0.0, 0.0);
	vec4 zero = vec4(0.0);
	
	for(int count = 0; count < sampleCount; count++){

		texCo = mix(start, end, float(count)/float(sampleCount));// - originOffset;

		//texCo = start + increment*float(count);
		px = texture(tex, texCo).r;

		
		//px = length(texture(normals, texCo).xyz - 0.5);
		//px = px * 1.5;
		
		pxColor = texture(colorMap, vec2(px, 0.0));
		
		/*normal = texture(normals, texCo).xyz - 0.5;
		float directional = clamp(dot(normalize(normal), directionalVector), 0.0, 1.0);

		pxColor.rgb = ambientLight*pxColor.rgb + directionalLight*directional*pxColor.rgb;*/
			
		
		//value = mix(value, pxColor, px);
		//value = (1.0-value.a)*pxColor + value;
		//value = mix(pxColor, zero, value.a) + value;
		
		value = value + pxColor - pxColor*value.a;
		
		if(value.a >= 0.95){
			break;
		}
	}
	color = value;
}

`;











