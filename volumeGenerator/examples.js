

var examples = {




	
sphere: `/*
    The parameters x, y and z are floating point numbers between -1 and 1.
    Use the variable out to set the result as a float between 0 and 1.
*/

var radius = 0.8;

if(Math.sqrt(x*x + y*y + z*z) <= radius){
    out = 1;
}`





,hollowSphere: `/*
    The parameters x, y and z are floating point numbers between -1 and 1.
    Use the variable out to set the result as a float between 0 and 1.
*/

var radius = 0.8;
var thickness = 0.01;

var dist = Math.sqrt(x*x + y*y + z*z);

if(Math.abs(radius-dist) < thickness){
	out = 1;
}`






,fuzzySphere: `/*
    The parameters x, y and z are floating point numbers between -1 and 1.
    Use the variable out to set the result as a float between 0 and 1.
*/

var radius = 0.8;

var dist = Math.sqrt(x*x + y*y + z*z);

if(dist <= radius){
    out = (radius-dist)/radius;
}`






,cube: `/*
    The parameters x, y and z are floating point numbers between -1 and 1.
    Use the variable out to set the result as a float between 0 and 1.
*/

var sideLength = 1.8;

if(Math.abs(x) < sideLength/2 && Math.abs(y) < sideLength/2 && Math.abs(z) < sideLength/2){
    out = 1;
}`





,hollowCube: `/*
    The parameters x, y and z are floating point numbers between -1 and 1.
    Use the variable out to set the result as a float between 0 and 1.
*/

var sideLength = 1.2;
var thickness = 0.05;

if(
  (Math.abs(x) < sideLength/2           && Math.abs(y) < sideLength/2           && Math.abs(z) < sideLength/2)
&&(Math.abs(x) > sideLength/2-thickness || Math.abs(y) > sideLength/2-thickness || Math.abs(z) > sideLength/2-thickness))
{
    out = 1;
}`






};












