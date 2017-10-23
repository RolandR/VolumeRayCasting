


function matrix3FromQuaternion(q){

	var x = q[0];
	var y = q[1];
	var z = q[2];
	var w = q[3];
	
	var n = w * w + x * x + y * y + z * z
	var s = n == 0 ? 0 : 2 / n;
	var wx = s * w * x, wy = s * w * y, wz = s * w * z
	var xx = s * x * x, xy = s * x * y, xz = s * x * z
	var yy = s * y * y, yz = s * y * z, zz = s * z * z

	return[
		1 - (yy + zz),         xy - wz,          xz + wy ,
			xy + wz,     1 - (xx + zz),         yz - wx  ,
			xz - wy,          yz + wx,     1 - (xx + yy),
	];

}


function matrix4FromQuaternion(q){

	var x = q[0];
	var y = q[1];
	var z = q[2];
	var w = q[3];
	
	var n = w * w + x * x + y * y + z * z
	var s = n == 0 ? 0 : 2 / n;
	var wx = s * w * x, wy = s * w * y, wz = s * w * z
	var xx = s * x * x, xy = s * x * y, xz = s * x * z
	var yy = s * y * y, yz = s * y * z, zz = s * z * z

	return[
		1 - (yy + zz),         xy - wz,          xz + wy , 0,
			xy + wz,     1 - (xx + zz),         yz - wx  , 0,
			xz - wy,          yz + wx,     1 - (xx + yy),  0,
		0,				0, 				   0,			   1
	];

}