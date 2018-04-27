


var volumes = {
	 sagittal: {
		 src: "./images/sagittal.png"
		,name: "Brain - Water"
		,columns: 2
		,slices: 176
		,zScale: 0.7
	}
	,vessels: {
		 src: "./images/vessels.png"
		,name: "Brain - Vessels"
		,columns: 1
		,slices: 160
		,zScale: 0.65
	}
	,handgelenk: {
		 src: "./images/handgelenk.jpg"
		,name: "Wrist"
		,columns: 4
		,slices: 316
		,zScale: 1.5
	}
	,handgelenk2: {
		 src: "./images/handgelenk2.jpg"
		,name: "Wrist 2"
		,columns: 2
		,slices: 160
		,zScale: 0.5
	}
	,broccoli: {
		 src: "./images/broccoli.png"
		,name: "Broccoli"
		,columns: 1
		,slices: 50
		,zScale: 0.7
	}
	,sphereAntialiased: {
		 src: "./images/sphere_antialiased.png"
		,name: "Sphere (Anti-aliased)"
		,columns: 16
		,slices: 256
		,zScale: 1
	}
	,cube: {
		 src: "./images/cuuube.png"
		,name: "Cube"
		,columns: 16
		,slices: 128
		,zScale: 1
	}
	,smallSphere: {
		 src: "./images/smallsphere.png"
		,name: "Small Sphere"
		,columns: 16
		,slices: 128
		,zScale: 1
	}
};

var shaders = {
	 specular: {
		 name: "Specular"
		,vert: "./js/shaders/vertex.vert"
		,frag: "./js/shaders/specular.frag"
	}
	,basic: {
		 name: "Basic"
		,vert: "./js/shaders/vertex.vert"
		,frag: "./js/shaders/basic.frag"
	}
	,maxValue: {
		 name: "Maximum Intensity"
		,vert: "./js/shaders/vertex.vert"
		,frag: "./js/shaders/maxValue.frag"
	}
	,shaded: {
		 name: "Shaded"
		,vert: "./js/shaders/vertex.vert"
		,frag: "./js/shaders/shaded.frag"
	}
	,realistic: {
		 name: "Realistic"
		,vert: "./js/shaders/vertex.vert"
		,frag: "./js/shaders/realistic.frag"
	}
	/*,refraction: {
		 name: "Refraction"
		,vert: "./js/shaders/vertex.vert"
		,frag: "./js/shaders/refraction.frag"
	}*/
}


var Renderer = function(){

	var img = document.getElementById("slice");
	var colorMap = document.createElement("img");
	
	/*colorMap.onload = updateLoadedImages;
	colorMap.src = "./colorMappings/skyline.png";*/

	var canvas = document.getElementById("canvas");
	var container = document.getElementById("container");
	canvas.width = container.clientWidth;
	canvas.height = container.clientHeight;
	var aspect = canvas.width / canvas.height;
	
	var gl = canvas.getContext("webgl2");
	var shaderProgram;
	var size;

	var volumeTexture;
	var colorTexture;
	var normalsTexture;
	var skyboxTexture;
	
	var zScale = 1;
	
	var depthSampleCountRef
	var opacitySettingsRef;
	var lightPositionRef;
	var transformRef;
	var zScaleRef;

	var opacities = new Uint8Array(256);
	var colorTransfer = new Uint8Array(3*256);

	initGl();

	changeColorTexture("./colorMappings/colors1.png");
	updateOpacity();
	changeVolume(volumes.sagittal);
	loadSkybox();
	changeShader(shaders.specular);

	/*img.onload = processVolume;
	img.src = "./images/sagittal.png";*/

	/*var imagesLoaded = 0;
	var imagesToLoad = 2;

	function updateLoadedImages(){
		imagesLoaded++;
		if(imagesLoaded == imagesToLoad){
			render();
		}
	}*/

	function updateOpacity(){

		//var opacities = new Uint8Array(256);

		for(var i = 0; i < opacities.length; i++){
			var px = i/opacities.length;
			px = px*px;
			
			if(px <= lowNode){
				opacities[i] = minLevel*255;
			} else if(px > highNode){
				opacities[i] = maxLevel*255;
			} else {
				var ratio = (px-lowNode)/(highNode-lowNode);
				opacities[i] = (minLevel*(1-ratio) + maxLevel*ratio)*255;
			}
		}

		updateTransferTexture();
	}

	function updateTransferTexture(){
		
		var transferData = new Uint8Array(4*256);
		
		for(var i = 0; i < 256; i++){

			var r = colorTransfer[i*3+0]/256;
			var g = colorTransfer[i*3+1]/256;
			var b = colorTransfer[i*3+2]/256;
			var a = opacities[i]/256;

			r = r*r*a;
			g = g*g*a;
			b = b*b*a;
			
			transferData[i*4+0] = r*256;
			transferData[i*4+1] = g*256;
			transferData[i*4+2] = b*256;
			
			transferData[i*4+3] = a*256;
		}
		
		gl.activeTexture(gl.TEXTURE1);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, transferData, 0);
		
		draw();
	}

	function changeColorTexture(src){
		colorMap.onload = function(){
			var colorCanvas = document.createElement("canvas");
			colorCanvas.height = colorMap.height;
			colorCanvas.width = colorMap.width;
			var colorContext = colorCanvas.getContext("2d");
			colorContext.drawImage(colorMap, 0, 0);
			var colorData = colorContext.getImageData(0, 0, colorMap.width, colorMap.height).data;
			
			for(var i = 0; i < 256; i++){
				colorTransfer[i*3  ] = colorData[i*4  ];
				colorTransfer[i*3+1] = colorData[i*4+1];
				colorTransfer[i*3+2] = colorData[i*4+2];
			}
			
			updateTransferTexture();
		};
		colorMap.src = src;
	}

	function loadSkybox(){

		var skyboxImg = document.createElement("img");
		skyboxImg.onload = function(){
			
			var img = this;
			var c = document.createElement("canvas");
			c.width = img.width;
			c.height = img.height;
			var ctx = c.getContext("2d");
			ctx.drawImage(this, 0, 0);
			var imageData = Uint8Array.from(ctx.getImageData(0, 0, c.width, c.height).data);

			var width = img.width;
			var height = width;

			var length = width*height*4;
			var offset = 0;
			
			gl.activeTexture(gl.TEXTURE3);
			
			gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageData.slice(offset*length, offset*length+length));
			offset++;
			gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageData.slice(offset*length, offset*length+length));
			offset++;
			gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageData.slice(offset*length, offset*length+length));
			offset++;
			gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageData.slice(offset*length, offset*length+length));
			offset++;
			gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageData.slice(offset*length, offset*length+length));
			offset++;
			gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageData.slice(offset*length, offset*length+length));

			gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
			gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);

			draw();
			//console.log(this);
		};
		skyboxImg.src = "./images/skybox/bleak-outlook.png";
	}
	
	function changeShader(shader){
		
		loadFile(shader.vert, function(response){
			
			vertexShader = response;
			
			loadFile(shader.frag, function(response){
				
				fragmentShader = response;
				compileShaders();
				draw();
				
			});
		});
		
	}
	
	function compileShaders(){
		
		// Create a vertex shader object
		var vertShader = gl.createShader(gl.VERTEX_SHADER);

		// Attach vertex shader source code
		gl.shaderSource(vertShader, vertexShader);

		// Compile the vertex shader
		gl.compileShader(vertShader);

		// Create fragment shader object
		var fragShader = gl.createShader(gl.FRAGMENT_SHADER);

		// Attach fragment shader source code
		gl.shaderSource(fragShader, fragmentShader);

		// Compile the fragmentt shader
		gl.compileShader(fragShader);

		// Create a shader program object to store
		// the combined shader program
		shaderProgram = gl.createProgram();

		// Attach a vertex shader
		gl.attachShader(shaderProgram, vertShader); 

		// Attach a fragment shader
		gl.attachShader(shaderProgram, fragShader);

		// Link both programs
		gl.linkProgram(shaderProgram);

		// Use the combined shader program object
		gl.useProgram(shaderProgram);

		if(gl.getShaderInfoLog(vertShader)){
			console.warn(gl.getShaderInfoLog(vertShader));
		}
		if(gl.getShaderInfoLog(fragShader)){
			console.warn(gl.getShaderInfoLog(fragShader));
		}
		if(gl.getProgramInfoLog(shaderProgram)){
			console.warn(gl.getProgramInfoLog(shaderProgram));
		}
		
		
		vertexBuffer = gl.createBuffer();

		/*==========Defining and storing the geometry=======*/

		var vertices = [
			-1.0, -1.0,
			 1.0, -1.0,
			-1.0,  1.0,
			-1.0,  1.0,
			 1.0, -1.0,
			 1.0,  1.0
		];

		size = ~~(vertices.length/2);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		//gl.bindBuffer(gl.ARRAY_BUFFER, null);

		//gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		
		bindTextures();
		updateAttribPointers();
		
	}
	
	function updateAttribPointers(){
		// Get the attribute location
		var coord = gl.getAttribLocation(shaderProgram, "coordinates");

		// Point an attribute to the currently bound VBO
		gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);

		// Enable the attribute
		gl.enableVertexAttribArray(coord);

		zScaleRef = gl.getUniformLocation(shaderProgram, "zScale");
		gl.uniform1f(zScaleRef, zScale);
		aspectRef = gl.getUniformLocation(shaderProgram, "aspect");
		gl.uniform1f(aspectRef, aspect);
		
		depthSampleCountRef = gl.getUniformLocation(shaderProgram, "depthSampleCount");
		gl.uniform1i(depthSampleCountRef, 512);

		refractionFactorRef = gl.getUniformLocation(shaderProgram, "refractionFactor");
		gl.uniform1f(refractionFactorRef, 1);
		
		opacitySettingsRef = gl.getUniformLocation(shaderProgram, "opacitySettings");
		lightPositionRef = gl.getUniformLocation(shaderProgram, "lightPosition");
		
		transformRef = gl.getUniformLocation(shaderProgram, "transform");
		inverseTransformRef = gl.getUniformLocation(shaderProgram, "inverseTransform");
	}
	
	function bindTextures(){
		
		// lookup the sampler locations.
		var u_image0Location = gl.getUniformLocation(shaderProgram, "tex");
		var u_image1Location = gl.getUniformLocation(shaderProgram, "colorMap");
		var u_image2Location = gl.getUniformLocation(shaderProgram, "normals");
		var u_image3Location = gl.getUniformLocation(shaderProgram, "skybox");

		gl.uniform1i(u_image0Location, 0);  // texture unit 0
		gl.uniform1i(u_image1Location, 1);  // texture unit 1
		gl.uniform1i(u_image2Location, 2);  // texture unit 2
		gl.uniform1i(u_image3Location, 3);  // texture unit 3
		
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_3D, volumeTexture);
		
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, colorTexture);
		
		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_3D, normalsTexture);
		
		gl.activeTexture(gl.TEXTURE3);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);
	}
	
	function createTextures(){
	
		volumeTexture = gl.createTexture();
		//gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_3D, volumeTexture);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_BASE_LEVEL, 0);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
		gl.texImage3D(
			gl.TEXTURE_3D,  // target
			0,              // level
			gl.LUMINANCE,        // internalformat
			1,           // width
			1,           // height
			1,           // depth
			0,              // border
			gl.LUMINANCE,         // format
			gl.UNSIGNED_BYTE,       // type
			Uint8Array.from([0])            // pixel
		);

		colorTexture = gl.createTexture();
		//gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, colorTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, Uint8Array.from([0, 0, 0, 0]), 0);

		normalsTexture = gl.createTexture();
		//gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_3D, normalsTexture);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_BASE_LEVEL, 0);
		//gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAX_LEVEL, Math.log2(texSize));
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
		gl.texImage3D(
			gl.TEXTURE_3D,  // target
			0,              // level
			gl.RGB,        // internalformat
			1,           // width
			1,           // height
			1,           // depth
			0,              // border
			gl.RGB,         // format
			gl.UNSIGNED_BYTE,       // type
			Uint8Array.from([0, 0, 0])            // pixel
		);

		skyboxTexture = gl.createTexture();
		//gl.activeTexture(gl.TEXTURE3);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);
		gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, Uint8Array.from([0, 0, 0, 0]), 0);
		gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, Uint8Array.from([0, 0, 0, 0]), 0);
		gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, Uint8Array.from([0, 0, 0, 0]), 0);
		gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, Uint8Array.from([0, 0, 0, 0]), 0);
		gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, Uint8Array.from([0, 0, 0, 0]), 0);
		gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, Uint8Array.from([0, 0, 0, 0]), 0);
		//gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
	}

	function initGl(){
		
		createTextures();
		compileShaders();
		
	}

	function changeVolume(volume){
		var img = document.createElement("img");
		img.onload = function(e){
			var imageColumns = volume.columns;
			var imageWidth = img.width/imageColumns;
			var slices = volume.slices;
			var imageHeight = img.height/(slices/imageColumns);

			var textureCanvas = document.createElement("canvas");
			var textureContext = textureCanvas.getContext("2d");

			var textureData = new Uint8Array(imageWidth * imageHeight * slices);

			for(var c = 0; c < imageColumns; c++){
				textureCanvas.width = imageWidth;
				textureCanvas.height = img.height;
				textureContext.drawImage(img, -c*imageWidth, 0);
				var imageData = textureContext.getImageData(0, 0, textureCanvas.width, textureCanvas.height).data;
				
				for(var i = 0; i < textureData.length/imageColumns; i++){
					textureData[i+c*textureData.length/imageColumns] = imageData[i*4];
				}
			}

			var normals = new Uint8ClampedArray(textureData.length*3);

			var xn = 0;
			var yn = 0;
			var zn = 0;

			for(var i = 0; i < textureData.length; i++){

				xn = textureData[i-1] - textureData[i+1];
				if(!isNaN(xn)){
					normals[i*3  ] = xn + 128;
				} else {
					normals[i*3  ] = 128;
				}

				yn = textureData[i-imageWidth] - textureData[i+imageWidth];
				if(!isNaN(yn)){
					normals[i*3+1] = yn + 128;
				} else {
					normals[i*3+1] = 128;
				}

				zn = textureData[i-(imageWidth*imageHeight)] - textureData[i+(imageWidth*imageHeight)];
				if(!isNaN(zn)){
					normals[i*3+2] = zn + 128;
				} else {
					normals[i*3+2] = 128;
				}
				
			}

			normals = new Uint8Array(normals);

			updateVolumeTexture(textureData, imageWidth, imageHeight, slices);
			updateNormalsTexture(normals, imageWidth, imageHeight, slices);
			zScale = volume.zScale;
			updateZScale(volume.zScale);

			draw();
		}
		img.src = volume.src;
	}

	function updateZScale(zScale){
		gl.uniform1f(zScaleRef, zScale);
	}

	function updateVolumeTexture(textureData, width, height, slices){
		// Volumetric data
		gl.activeTexture(gl.TEXTURE0);
		gl.texImage3D(
			gl.TEXTURE_3D,  // target
			0,              // level
			gl.LUMINANCE,        // internalformat
			width,           // width
			height,           // height
			slices,           // depth
			0,              // border
			gl.LUMINANCE,         // format
			gl.UNSIGNED_BYTE,       // type
			textureData            // pixel
		);
		//gl.generateMipmap(gl.TEXTURE_3D);
	}

	function updateNormalsTexture(normals, width, height, slices){
		// Normals
		gl.activeTexture(gl.TEXTURE2);
		gl.texImage3D(
			gl.TEXTURE_3D,  // target
			0,              // level
			gl.RGB,        // internalformat
			width,           // width
			height,           // height
			slices,           // depth
			0,              // border
			gl.RGB,         // format
			gl.UNSIGNED_BYTE,       // type
			normals            // pixel
		);
	}
	
	var changed = true;
	render();

	function render(){
		if(changed){
			gl.uniformMatrix4fv(transformRef, false, transform);
			gl.uniformMatrix4fv(inverseTransformRef, false, inverseTransform);
			//gl.uniform4f(opacitySettingsRef, Math.pow(minLevel, 2), Math.pow(maxLevel, 2), lowNode, highNode);

			//var now = Date.now()/1000;
			//gl.uniform3f(lightPositionRef, Math.sin(now), Math.cos(now), Math.sin(now*0.783));

			gl.drawArrays(gl.TRIANGLES, 0, size);
			
			changed = false;
		}
		requestAnimationFrame(render);
	}

	//render();

	function draw(){

		changed = true;
	}

	function changeSampleCount(count){
		gl.uniform1i(depthSampleCountRef, count);
		draw();
	}

	function changeRefractionFactor(factor){
		gl.uniform1f(refractionFactorRef, factor);
		draw();
	}

	window.addEventListener("resize", function(event){
		canvas.width = container.clientWidth;
		canvas.height = container.clientHeight;
		aspect = canvas.width / canvas.height;
		gl.uniform1f(aspectRef, aspect);
		gl.viewport(0, 0, canvas.width, canvas.height);
		draw();
	});

	//render();

	return {
		 changeColorTexture: changeColorTexture
		,changeSampleCount: changeSampleCount
		,changeRefractionFactor: changeRefractionFactor
		,changeVolume: changeVolume
		,changeShader: changeShader
		,updateOpacity: updateOpacity
		,draw: draw
	};

}










