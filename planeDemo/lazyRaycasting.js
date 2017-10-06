

var img = document.getElementById("slice");
var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");

canvas.height = img.height * Math.sqrt(2);
canvas.width = img.width * Math.sqrt(2);

var cutCanvas = document.getElementById("cut");
var cutContext = cutCanvas.getContext("2d");

cutCanvas.height = 1;
cutCanvas.width = img.width * Math.sqrt(2);

context.drawImage(img, (canvas.width-img.width)/2, (canvas.height-img.height)/2);
var imageData = context.getImageData(0, 0, canvas.width, canvas.height);

var cutImageData = cutContext.getImageData(0, 0, cutCanvas.width, cutCanvas.height);

var angle = 0;
var rayLength = img.width * Math.sqrt(2);
var samplingRate = 1;
var sampleCount = samplingRate*rayLength;
var sampleDistance = rayLength/sampleCount;

context.fillStyle = "#00FF00";
context.strokeStyle = "#FF0000";

console.log(imageData);

draw();


function draw(){

	context.clearRect(0, 0, canvas.width, canvas.height);
	context.drawImage(img, (canvas.width-img.width)/2, (canvas.height-img.height)/2);
	
	var increment = [Math.sin(angle)*sampleDistance, Math.cos(angle)*sampleDistance];

	context.beginPath();
	context.moveTo(
		Math.sin(angle)*rayLength/2-Math.cos(angle)*rayLength/2 + rayLength/2,
		Math.cos(angle)*rayLength/2+Math.sin(angle)*rayLength/2 + rayLength/2
	);
	context.lineTo(
		Math.sin(angle)*rayLength/2+Math.cos(angle)*rayLength/2 + rayLength/2,
		Math.cos(angle)*rayLength/2-Math.sin(angle)*rayLength/2 + rayLength/2
	);
	context.stroke();

	for(var s = 0; s < sampleCount; s++){
		var xPos = s;

		var pos = [
			Math.sin(angle)*rayLength/2 + Math.cos(angle)*((xPos-rayLength/2)/rayLength)*rayLength + rayLength/2,
			Math.cos(angle)*rayLength/2 - Math.sin(angle)*((xPos-rayLength/2)/rayLength)*rayLength + rayLength/2
		];

		var max = 0;
		
		for(var i = 0; i < sampleCount; i++){

			//context.fillRect(Math.round(pos[0]), Math.round(pos[1]), 1, 1);
			var value = getColorAtCoord(Math.round(pos[0]), Math.round(pos[1]), imageData);
			max = Math.max(max, value[0]);
			pos[0] -= increment[0];
			pos[1] -= increment[1];
		}

		cutImageData.data[s*4+0] = max;
		cutImageData.data[s*4+1] = max;
		cutImageData.data[s*4+2] = max;
		cutImageData.data[s*4+3] = 255;

	}

	
	cutContext.putImageData(cutImageData, 0, 0);

	angle += 0.01;
	setTimeout(draw, 16);

}

function getColorAtCoord(x, y, imageData){

	if(x<0 || x>=imageData.width || y<0 || y>=imageData.height){
		return [0, 0, 0, 0];
	}

	var pos = (x + y*imageData.width)*4;
	return [
		 imageData.data[pos+0]
		,imageData.data[pos+1]
		,imageData.data[pos+2]
		,imageData.data[pos+3]
	];
	
}

















