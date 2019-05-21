function loadFile(url, callback){
	
	var xmlhttp;
	xmlhttp = new XMLHttpRequest();
	
	xmlhttp.onreadystatechange = function(){
		if (xmlhttp.readyState == 4){
			callback(xmlhttp.responseText, xmlhttp.status, url);
		}
	};

	xmlhttp.overrideMimeType("text/plain");
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
	
}
