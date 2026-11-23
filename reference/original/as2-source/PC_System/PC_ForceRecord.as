/****************************************************
* PowerCursor project, TU/e Industrial Design
* 
*  PC_FORCERCOERD
* 
* 
****************************************************/

class PC_System.PC_ForceRecord {

	private var __x:Number;
	private var __y:Number;
	
	private var __sender:String;
	
	// Constructor
	//--------------------------------------
	function PC_ForceRecord(xForce:Number, yForce:Number, senderPath:String) {
		__x = xForce;
		__y = yForce;
		__sender = senderPath;
	}

	
	// Getters & Setters
	//--------------------------------------
	// All pretty self-explanatory, these set and get the private variables.

	// __sender
	public function get sender():String {
		return __sender;
	}
	public function set sender(newSender:String) {
		__sender = newSender;
	}
	
	// __x/ySpeed
	public function get x():Number {
		return __x;
	}
	public function set x(xs: Number) {
		if (!isNaN(xs)) {
			__x = xs;
		}
	}
	public function get y():Number {
		return __y;
	}
	public function set y(ys: Number) {
		if (!isNaN(ys)) {
			__y = ys;
		}
	}	

}