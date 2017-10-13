var fragmentShader = `#version 300 es

precision lowp float;
precision lowp int;
precision lowp sampler3D;

uniform sampler3D tex;
uniform sampler2D colorMap;

uniform mat4 transform;
uniform int depthSampleCount;

uniform vec4 opacitySettings;
// x: minLevel
// y: maxLevel
// z: lowNode
// w: highNode

in vec2 texCoord;
out vec4 color;

float getPx(float px){
	if(px <= opacitySettings.z){
		return opacitySettings.x;
	} else if(px > opacitySettings.w){
		return opacitySettings.y;
	} else {
		return mix(opacitySettings.x, opacitySettings.y, (px-opacitySettings.z)/(opacitySettings.w-opacitySettings.z));
	}
}

void main(){
	vec4 value = vec4(0.0, 0.0, 0.0, 0.0);
	float s = 0.0;
	float px = 0.0;
	vec4 pxColor = vec4(0.0, 0.0, 0.0, 0.0);

	vec3 texCo = vec3(0.0, 0.0, 0.0);
	
	vec4 startCoord = vec4(texCoord, -1.0, 1.0);
	startCoord = transform * startCoord;
	startCoord = startCoord / startCoord.w;
	startCoord = startCoord + 0.5;
	startCoord.z = startCoord.z*1.4 - 0.25;

	vec3 start = startCoord.xyz;

	vec4 endCoord = vec4(texCoord, 1.0, 1.0);
	endCoord = transform * endCoord;
	endCoord = endCoord / endCoord.w;
	endCoord = endCoord + 0.5;
	endCoord.z = endCoord.z*1.4 - 0.25;

	vec3 end = endCoord.xyz;
	
	for(int count = 0; count < depthSampleCount; count++){
		
		s = float(count)/float(depthSampleCount);

		texCo = mix(start, end, s);
		pxColor = vec4(0.0, 0.0, 0.0, 0.0);
		
		if(texCo.x > 1.0 || texCo.y > 1.0 || texCo.z > 1.0 || texCo.x < 0.0 || texCo.y < 0.0 || texCo.z < 0.0){
			//pxColor.a = 0.0;
		} else {
			px = texture(tex, texCo).r;
			pxColor = texture(colorMap, vec2(px, 0.0));
			px = px*px;
			
			px = getPx(px);
			
			pxColor.a = px;
		}
		//value = mix(value, pxColor, px);
		pxColor.rgb *= pxColor.a;
		value = (1.0-value.a)*pxColor + value;
		
		if(value.a >= 1.0){
			break;
		}
	}
	color = vec4(value.rgb, 1.0);
}

`;











