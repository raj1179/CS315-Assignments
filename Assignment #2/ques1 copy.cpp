#include <vector>
#include <iostream>
#include <math.h>
using namespace std;

float DotProduct(vector<float> v1, vector<float> v2){

	float sum = 0;

	if(v1.size() != v2.size()){
		cout << "DotProduct(): Types are not same." << endl;
		exit(1);
	}else {
		for(int i = 0; i < v1.size(); i++){
			sum += v1[i] * v2[i];
		}return sum;
	}
}

float Magnitude(vector<float> v){

	float mag;
	float x = v[0];
	float y = v[1];
	float z = v[2];

	if(v.size() != 3){
		cout << "Magnitude(): type not vec3." << endl;
		exit(1);
	}else{
		return mag = sqrt((x * x) + (y * y) + (z * z));
	}
}

float FindAngle(vector<float> v1, vector<float> v2){

	float mag_v1 = Magnitude(v1);
	float mag_v2 = Magnitude(v2);
	float cosTheta = (DotProduct(v1, v2) / (mag_v1 * mag_v2));
	float alpha = acos(cosTheta)*180/3.14159265359;
	return alpha;
}

vector <float> CrossProduct(vector<float> v1, vector<float> v2){

	vector<float> crossProduct;

	if(v1.size() != v2.size()){
		cout << "CrossProduct(): Types are not same." << endl;
		exit(1);
	}else{
		crossProduct = {(v1[1] * v2[2]) - (v1[2] * v2[1]),
						(v1[2] * v2[0]) - (v1[0] * v2[2]),
						(v1[0] * v2[1]) - (v1[1] * v2[0])};

		return crossProduct;
	}
}

int main(){

	vector<float>v1 {2.1,2.4,3.7} ;
	vector<float>v2 {9.4,1.3,6.5} ;

	cout << "Dot product is: " << DotProduct(v1, v2) << endl;
	cout << "The angle is: " << FindAngle(v1, v2) << endl;
	vector<float>crossProduct = CrossProduct(v1, v2);
	cout << "The cross product is:";
	for (int i = 0; i < 3; i++){
		cout << crossProduct[i] << " ";
	}
	cout << endl;

	return 0;
}
