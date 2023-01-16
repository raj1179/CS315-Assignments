#include <vector>
#include <iostream>
#include <math.h>
using namespace std;

// the class that would let us make a vec3 object.
class vec3{

	public:
	// three members (components of the vector)
		float x, y, z;

	// default constructor
	vec3(){
		x = 0.0f;
		y = 0.0f;
		z = 0.0f;
	}
	// parametric constructor
	vec3(float X, float Y, float Z){
		x = X;
		y = Y;
		z = Z;
	}
};

// tis function would return the sum of multiplication the corresponding components of the vector.
float DotProduct(vec3 v1, vec3 v2){

	float sum = 0;
	return sum = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;

}

// this function would return the magnitude (distance) of the vector.
float Magnitude(vec3 v){

	float mag;
	float x = v.x;
	float y = v.y;
	float z = v.z;

	return mag = sqrt((x * x) + (y * y) + (z * z));

}

// this function would return the angle form by two vectors at a vertice. 
float FindAngle(vec3 v1, vec3 v2){

	float mag_v1 = Magnitude(v1);
	float mag_v2 = Magnitude(v2);
	float cosTheta = (DotProduct(v1, v2) / (mag_v1 * mag_v2));
	float alpha = acos(cosTheta)*180/3.14159265359;
	return alpha;
}

// this function would return the Cross Product of two vectors.
vec3 CrossProduct(vec3 v1, vec3 v2){

	vec3 crossProduct;

		crossProduct.x = (v1.y * v2.z) - (v1.z * v2.y);
		crossProduct.y = (v1.z * v2.x) - (v1.x * v2.z);
		crossProduct.z = (v1.x * v2.y) - (v1.y * v2.x);

		return crossProduct;
}

// sample run
int main(){

	vec3 v1 (2.1,2.4,3.7) ;
	vec3 v2 (9.4,1.3,6.5) ;
	vec3 crossProduct = CrossProduct(v1, v2);

	cout << "Dot product is: " << DotProduct(v1, v2) << endl;
	cout << "The angle is: " << FindAngle(v1, v2) << endl;
	cout << "The cross product is: " << crossProduct.x << " " << crossProduct.y << " "  << crossProduct.z << endl;

	return 0;
}
