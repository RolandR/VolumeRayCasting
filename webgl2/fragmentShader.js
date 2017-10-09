var fragmentShader = `#version 300 es

precision highp float;
precision highp int;
precision highp sampler3D;

uniform sampler3D tex;
uniform mat4 transform;
in vec2 texCoord;
//in mat4 trans;
out vec4 color;

void main()
{
	float value = 0.0;
	float s = 0.0;
	float px = 0.0;
	vec4 texCo = vec4(0.0, 0.0, 0.0, 0.0);
	for(int count = 0; count < 256; count++){
		s = float(count)/256.0;

		texCo = vec4(texCoord, s, 1.0);
		texCo = transform * texCo;
		texCo = texCo / texCo.w;
		texCo = (texCo/2.0 + 0.5);
		px = texture(tex, texCo.xyz).r;
		value = value*(1.0-px) + px*px;
		
		/*px = texture(tex, vec3(texCoord, s)).r;
		value = value*(1.0-px) + px*px;*/
	}
	color = vec4(value, value, value, 1.0);
}

`;