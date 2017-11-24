#version 300 es

precision highp float;
precision highp int;
precision highp sampler3D;

uniform sampler3D tex;
uniform sampler3D normals;
uniform sampler2D colorMap;
uniform samplerCube skybox;

uniform mat4 transform;
uniform mat4 inverseTransform;
uniform int depthSampleCount;
uniform float zScale;

uniform float refractionFactor;

uniform vec3 lightPosition;

//uniform vec4 opacitySettings;
// x: minLevel
// y: maxLevel
// z: lowNode
// w: highNode

in vec2 texCoord;

//in vec4 origin;
//in vec4 direction;

out vec4 color;

const vec3 ambientLight = vec3(0.34, 0.32, 0.32);
//const vec3 ambientLight = vec3(0.0, 0.0, 0.0);
const vec3 directionalLight = vec3(0.5, 0.5, 0.5);
const vec3 lightVector = normalize(vec3(-1.0, 0.0, 0.0));
const vec3 specularColor = vec3(0.5, 0.5, 0.5);

const float specularIntensity = 0.2;
const float shinyness = 5.0;
const float scatterFactor = 2.0;
const float reflectScattering = 1.0;

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
	
	//transform = inverse(transform);
	
	vec4 origin = vec4(0.0, 0.0, 2.0, 1.0);
	origin = transform * origin;
	origin = origin / origin.w;
	origin.z = origin.z / zScale;
	origin = origin + 0.5;

	vec4 image = vec4(texCoord, 4.0, 1.0);
	image = transform * image;
	//image = image / image.w;
	image.z = image.z / zScale;
	image = image + 0.5;
	//vec4 direction = vec4(0.0, 0.0, 1.0, 0.0);
	vec4 direction = normalize(origin-image);
	//direction = transform * direction;

	Ray ray = makeRay(origin.xyz, direction.xyz);
	float tmin = 0.0;
	float tmax = 0.0;
	intersect(ray, aabb, tmin, tmax);

	vec4 value = vec4(0.0, 0.0, 0.0, 0.0);

	vec4 background = texture(skybox, direction.xyz);

	if(tmin > tmax){
		/*color = value;
		discard;*/

		color = background;
		return;
	}

	vec3 start = origin.xyz + tmin*direction.xyz;
	vec3 end = origin.xyz + tmax*direction.xyz;
	
	float len = distance(end, start);
	int sampleCount = int(float(depthSampleCount)*len);
	vec3 increment = (end-start)/float(sampleCount);
	float incLength = length(increment);
	increment = normalize(increment);
	vec3 pos = start;
	//vec3 originOffset = mod((start-origin.xyz), increment);

	float s = 0.0;
	float px = 0.0;
	vec4 pxColor = vec4(0.0, 0.0, 0.0, 0.0);
	vec3 texCo = vec3(0.0, 0.0, 0.0);
	vec3 normal = vec3(0.0, 0.0, 0.0);
	vec4 zero = vec4(0.0);

	float last = 0.0;
	
	for(int count = 0; count < sampleCount; count++){

		//texCo = mix(start, end, float(count)/float(sampleCount));// - originOffset;

		texCo = pos + incLength*increment;

		/*if(texCo.x < aabb[0].x || texCo.x > aabb[1].x
		 ||texCo.y < aabb[0].y || texCo.y > aabb[1].y
		 ||texCo.z < aabb[0].z || texCo.z > aabb[1].z)
		{
			//value = vec4(0.0, 1.0, 0.0, 1.0);
			break;
		}*/
		pos = texCo;
		
		px = texture(tex, texCo).r;
		//px = length(texture(normals, texCo).xyz - 0.5);
		
		pxColor = texture(colorMap, vec2(px, 0.0));

		//pxColor = length
		

		//if(abs(last-px) > 0.0){
			normal = normalize(texture(normals, texCo).xyz - 0.5);

			//normal = normalize(texCo.xyz - 0.5);
			
			//normal = (vec4(normal, 0.0) * inverseTransform).xyz;

			/*if(length(normal) < 0.01){
				value = vec4(1.0, 0.0, 0.0, 1.0);
				break;
			}*/
			
			//normal = normalize(normal);


			/*vec3 reflect = normalize(reflect(normalize(increment), normal));
			vec3 reflectColor = texture(skybox, reflect).rgb*pxColor.a;
			pxColor.rgb = reflectColor;*/
			//break;
			
			float eta = (1.0+last*refractionFactor)/(1.0+px*refractionFactor);
			
			//eta = 1.0;

			//refractVector = refract(increment, normal, eta);

			if(dot(normal, normalize(increment)) > 0.0){
				normal = -normal;
				eta = 1.0/eta;
			}

			incLength = incLength * eta;

			vec3 refractVector = normalize(refract(normalize(increment), normal, eta));

			if(length(refractVector) > 0.5){
				increment = refractVector;
			} else {
				pxColor = vec4(1.0, 0.5, 0.0, 0.1);
				//increment = normalize(reflect(normalize(increment), normal));
			}
		//}

		last = px;

		


		
		//float directional = clamp(dot(normal, lightVector), 0.0, 1.0);

		//vec3 R = -reflect(lightDirection, surfaceNormal);
		//return pow(max(0.0, dot(viewDirection, R)), shininess);

		//float specular = max(dot(direction.xyz, reflect(lightVector, normal)), 0.0);
		//specular = pow(specular, 100.0) * specularIntensity;

		//vec3 ambient = textureLod(skybox, -normal, 32.0).rgb;

		//pxColor.rgb = ambient*pxColor.rgb + directionalLight*directional*pxColor.rgb + pxColor.a*specular*specularColor;
		//pxColor.rgb = ambient;

		//normal = normalize(texture(normals, texCo).xyz - 0.5);

		/*if((last-px) > 0.1){
			vec3 reflect = -normalize(reflect(direction.xyz, normal));
			float angle = 1.0-clamp(pow(dot(direction.xyz, normal), 0.05), 0.0, 10.0);
			vec3 reflectColor = textureLod(skybox, reflect, reflectScattering).rgb*angle*pxColor.a*shinyness;
			
			pxColor.rgb = pxColor.rgb + reflectColor;
		}*/

		//pxColor.rgb = reflectColor;
			
		
		//value = mix(value, pxColor, px);
		//value = (1.0-value.a)*pxColor + value;
		//value = mix(pxColor, zero, value.a) + value;
		
		value = value + pxColor - pxColor*value.a;
		
		if(value.a >= 0.95){
			value.a = 1.0;
			break;
		}
	}

	background = texture(skybox, normalize(increment));
	color = mix(background, value, value.a);
	//color = value;
}
