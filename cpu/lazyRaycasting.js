

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

	var imageSize = imageData.width;
	var volumeData = new Uint8Array(imageData.data.length/4);
	for(var i = 0; i < volumeData.length; i++){
		volumeData[i] = imageData.data[i*4];
	}

	var cutImageData = cutContext.getImageData(0, 0, cutCanvas.width, cutCanvas.height);

	var startAngle = 0;
	var startTime = Date.now();
	var turnsPerSecond = 0.1;
	
	var rayLength = img.width * Math.sqrt(2);
	var samplingRate = 0.5;
	var sampleCount = samplingRate*rayLength;
	var sampleDistance = rayLength/sampleCount;

	draw();


	function draw(){

		var angle = ((Date.now()-startTime)/1000)*(2*Math.PI*turnsPerSecond);
		
		var increment = [Math.sin(angle)*sampleDistance, Math.cos(angle)*sampleDistance];
		var baseX = Math.sin(angle)*rayLength/2 + img.width/2;
		var baseY = Math.cos(angle)*rayLength/2 + img.width/2;
		var cosAngle = Math.cos(angle);
		var sinAngle = Math.sin(angle);

		for(var z = 0; z < zSize; z++){
			var imageZPos = z*cutImageData.width*4;
			for(var s = 0; s < rayLength; s++){

				var pos = [
					baseX + cosAngle*((s-rayLength/2)/rayLength)*rayLength,
					baseY - sinAngle*((s-rayLength/2)/rayLength)*rayLength
				];

				var output = 0;

				var x = 0;
				var y = 0;
				var value = 0;
				var v = 0;
				
				for(var i = 0; i < sampleCount; i++){
					
					x = Math.floor(pos[0]);
					y = Math.floor(pos[1]*1.3-25);
					value = 0;

					if(!(x<0 || x>=imageSize || y<0 || y>=imageSize)){
						value = volumeData[x + z*imageSize + y*imageSize*imageSize];
					}
					
					v = value/256;
					v = Math.pow(v, 2);
					output = output*(1-v) + value*v;
					pos[0] -= increment[0];
					pos[1] -= increment[1];
				}

				cutImageData.data[imageZPos + s*4+0] = output;
				cutImageData.data[imageZPos + s*4+1] = output;
				cutImageData.data[imageZPos + s*4+2] = output;
				cutImageData.data[imageZPos + s*4+3] = 255;

			}

		}

		
		cutContext.putImageData(cutImageData, 0, 0);

		frameCount++;
		
		requestAnimationFrame(draw);

	}

	var samplesPerFrame = Math.round(zSize*rayLength*sampleCount);
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








