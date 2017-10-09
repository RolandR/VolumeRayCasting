

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

	var cutImageData = cutContext.getImageData(0, 0, cutCanvas.width, cutCanvas.height);

	var angle = 1;
	var rayLength = img.width * Math.sqrt(2);
	var samplingRate = 1;
	var sampleCount = samplingRate*rayLength;
	var sampleDistance = rayLength/sampleCount;

	console.log(imageData);

	draw();


	function draw(){
		
		var increment = [Math.sin(angle)*sampleDistance, Math.cos(angle)*sampleDistance];

		for(var z = 0; z < zSize; z++){
			for(var s = 0; s < sampleCount; s++){
				var xPos = s;

				var pos = [
					Math.sin(angle)*rayLength/2 + Math.cos(angle)*((xPos-rayLength/2)/rayLength)*rayLength + img.width/2,
					Math.cos(angle)*rayLength/2 - Math.sin(angle)*((xPos-rayLength/2)/rayLength)*rayLength + img.width/2
				];

				var output = 0;
				
				for(var i = 0; i < sampleCount; i++){

					//context.fillRect(Math.round(pos[0]), Math.round(pos[1]), 1, 1);
					var value = getColorAtCoord(Math.round(pos[0]), Math.round(pos[1]), z, imageData);
					var v = value[0]/255;
					v = Math.pow(v, 1);
					output = output*(1-v) + value[0]*v;
					pos[0] -= increment[0];
					pos[1] -= increment[1];
				}

				cutImageData.data[z*cutImageData.width*4 + s*4+0] = output;
				cutImageData.data[z*cutImageData.width*4 + s*4+1] = output;
				cutImageData.data[z*cutImageData.width*4 + s*4+2] = output;
				cutImageData.data[z*cutImageData.width*4 + s*4+3] = 255;

			}

		}

		
		cutContext.putImageData(cutImageData, 0, 0);

		angle += 0.1;
		setTimeout(draw, 16);

	}

	function getColorAtCoord(x, y, z, imageData){

		if(x<0 || x>=imageData.width || y<0 || y>=imageData.width){
			return [0, 0, 0, 0];
		}

		var pos = (x + y*imageData.width + z*imageData.width*imageData.width)*4;
		return [
			 imageData.data[pos+0]
			,imageData.data[pos+1]
			,imageData.data[pos+2]
			,imageData.data[pos+3]
		];
		
	}
}








