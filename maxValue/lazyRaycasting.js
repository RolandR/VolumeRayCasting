

var img = document.getElementById("slice");

img.onload = render;
img.src = "./water.png";

function render(){
	var canvas = document.getElementById("canvas");
	var context = canvas.getContext("2d");

	canvas.height = img.height;
	canvas.width = img.width;

	var zSize = canvas.height / canvas.width;

	var cutCanvas = document.getElementById("cut");
	var cutContext = cutCanvas.getContext("2d");

	cutCanvas.height = img.width;
	cutCanvas.width = img.width * Math.sqrt(2);

	context.drawImage(img, 0, 0);


	var imageData = context.getImageData(0, 0, canvas.width, canvas.height);

	var imageSize = img.width;

	var volumes = [];
	var volumeSize = (imageData.data.length/imageSize)/4;

	for(var z = 0; z < imageSize; z++){
		volumes[z] = new Uint8Array(volumeSize);
		
		/*for(var i = 0; i < volumeSize; i++){
			volumes[z][i] = imageData.data[(i+z*volumeSize)*4];
		}*/
	}

	for(var x = 0; x < imageSize; x++){
		for(var y = 0; y < imageSize; y++){
			for(var z = 0; z < imageSize; z++){
				volumes[z][x+y*imageSize] = imageData.data[(x+z*imageSize+y*imageSize*imageSize)*4];
			}
		}
	}

	var cutImageData = cutContext.getImageData(0, 0, cutCanvas.width, cutCanvas.height);

	var startAngle = 0;
	var startTime = Date.now();
	var turnsPerSecond = 0.1;
	
	var rayLength = img.width * Math.sqrt(2);
	var samplingRate = 0.7;
	var sampleCount = samplingRate*rayLength;
	var sampleDistance = rayLength/sampleCount;

	var squared = new Float32Array(256);
	var cubed = new Float32Array(256);

	for(var i = 0; i < 256; i++){
		squared[i] = Math.pow(i/256, 2);
	}

	for(var i = 0; i < 256; i++){
		cubed[i] = Math.pow(i/256, 3);
	}

	draw();

	function intersect(start, direction){
		var aabb = [
			[0, 0],
			[imageSize, imageSize]
		];
		
		var xSign = (1/direction[0] < 0.0) ? 1 : 0;
		var ySign = (1/direction[1] < 0.0) ? 1 : 0;
		
		var txmin = (aabb[  xSign][0] - start[0]) * (1/direction[0]);
		var txmax = (aabb[1-xSign][0] - start[0]) * (1/direction[0]);
		var tymin = (aabb[  ySign][1] - start[1]) * (1/direction[1]);
		var tymax = (aabb[1-ySign][1] - start[1]) * (1/direction[1]);
		var tmin = Math.max(txmin, tymin);
		var tmax = Math.min(txmax, tymax);

		var begin = [start[0] + direction[0]*tmin, start[1] + direction[1]*tmin];
		var end   = [start[0] + direction[0]*tmax, start[1] + direction[1]*tmax];

		var count = 0;
		if(tmin < tmax){
			count = tmax-tmin;
		}

		return [
			begin,
			end,
			~~count
		];
	}


	function draw(){

		var angle = ((Date.now()-startTime)/1000)*(2*Math.PI*turnsPerSecond)+startAngle;
		
		var increment = [Math.sin(angle)*sampleDistance, Math.cos(angle)*sampleDistance*1.4];
		var baseX = Math.sin(angle)*rayLength/2 + img.width/2;
		var baseY = Math.cos(angle)*rayLength/2 + img.width/2;
		var cosAngle = Math.cos(angle);
		var sinAngle = Math.sin(angle);

		var startXPositions = new Float32Array(~~rayLength);
		var startYPositions = new Float32Array(~~rayLength);
		var sampleCounts = new Float32Array(~~rayLength);

		for(var i = 0; i < ~~rayLength; i++){

			var pos = [
				 baseX + cosAngle*((i-rayLength/2)/rayLength)*rayLength,
				(baseY - sinAngle*((i-rayLength/2)/rayLength)*rayLength)*1.4-imageSize/5
			];

			var intersection = intersect(pos, increment);
			
			startXPositions[i] = intersection[0][0];
			startYPositions[i] = intersection[0][1];
			sampleCounts[i] = intersection[2];
		}

		var zVolume;

		for(var z = 0; z < zSize; z++){
			var imageZPos = z*cutImageData.width*4;
			zVolume = volumes[z];
			for(var s = 0; s < ~~rayLength; s++){
				
				var pos = [
					startXPositions[s],
					startYPositions[s]
				];

				var output = 0.0;
				var saturation = 0.0;
				var x = 0.0;
				var y = 0.0;
				var value = 0;
				var v = 0.0;
				var a = 0.0;
				var max = 0.0;
				
				for(var i = 1; i < sampleCounts[s]; i++){
					
					x = ~~(pos[0] + i*increment[0]);
					y = ~~(pos[1] + i*increment[1]);
					value = zVolume[x + y*imageSize];

					if(value < 50){
						continue;
					}
					
					output = Math.max(value, output);
					//output = value > output ? value : output;
					
					if(output >= 250){
						break;
					}
					
				}

				var index = imageZPos + s*4;

				a = squared[output];
				
				cutImageData.data[index+0] = ~~(a*256);
				cutImageData.data[index+1] = ~~(a*256);
				cutImageData.data[index+2] = ~~(a*256);
				cutImageData.data[index+3] = 255;

			}

		}
		
		cutContext.putImageData(cutImageData, 0, 0);

		frameCount++;
		
		requestAnimationFrame(draw);

	}

	var samplesPerFrame = Math.round((zSize*rayLength*sampleCount)/2);
	document.getElementById("samplesPerFrame").innerHTML = samplesPerFrame.toLocaleString();

	var frameCount = 0;
	var lastFPS = Date.now();
	setTimeout(updateFPS, 1000);

	function updateFPS(){

		var timeDifference = Date.now()-lastFPS;
		lastFPS = Date.now();
		var fps = frameCount/(timeDifference/1000);
		frameCount = 0;
		document.getElementById("framesPerSecond").innerHTML = Math.round(fps);
		document.getElementById("samplesPerSecond").innerHTML = Math.round(samplesPerFrame*fps).toLocaleString();
		setTimeout(updateFPS, 1000);
		
	}
	
}








