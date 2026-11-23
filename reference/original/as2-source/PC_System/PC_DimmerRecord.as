/****************************************************
* PowerCursor project, TU/e Industrial Design
* 
*  PC_DIMMERRECORD
* 
* 
****************************************************/

class PC_System.PC_DimmerRecord {

	private var __dimming:Number;
	private var __scope:Boolean;
	private var __sender:String;
	
	// Constructor
	//--------------------------------------
	function PC_DimmerRecord(dimming:Number, scope:Boolean, senderPath:String) {
		__dimming = dimming;
		__scope = scope;
		__sender = senderPath;
	}

	
	// Getters & Setters
	//--------------------------------------
	// All pretty self-explanatory, these set and get the private variables.

	// __dimming
	public function get dimming():Number {
		return __dimming;
	}
	public function set dimming(newDimming: Number) {
		if (newDimming >= 0 && newDimming <= 100) {
			__dimming = newDimming;
		}
	}

	// __scope
	public function get scope():Boolean {
		return __scope;
	}
	public function set global(newScope: Boolean) {
		__scope = newScope;
	}	

	// __sender
	public function get sender():String {
		return __sender;
	}
	public function set sender(newSender:String) {
		__sender = newSender;
	}


}