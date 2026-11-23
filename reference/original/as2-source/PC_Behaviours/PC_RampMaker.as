/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* 
*  PC_RAMPMAKER
* 
* The PC_RampMaker works exactly like the PC_Ramp
* object, except that the RampMaker has no surface 
* itself but applies its cursor-pushing ability to 
* the surface of its parent symbol. This symbol will 
* push cursors away in a certain direction with 
* constant force. This direction is specified by an 
* angle parameter (in degrees). It is relative to 
* the object, so when a ramp is rotated, it will 
* push cursors in a different direction as well.
* 
****************************************************/

class PC_Behaviours.PC_RampMaker extends PC_Behaviours.PC_Behaviour {


	// Vars
	//--------------------------------------
	private var __strength:Number;
	private var __angle:Number;


	// Inspectables
	//--------------------------------------
	
	// Strength: A general indication of how much force this object applies
	[Inspectable(type="Number", defaultValue=3, name="Force Strength", category="Force")]
	public function set strength(newStrength:Number):Void {
		__strength = newStrength;
	}
	public function get strength():Number {
		return __strength;
	}

	// Angle: In which direction cursors should be pushed
	[Inspectable(type="Number", defaultValue=0, name="Force Angle", category="Force")]
	public function set angle(newAngle:Number):Void {
		__angle = newAngle;
	}
	public function get angle():Number {
		return __angle;
	}



	// Constructor
	//--------------------------------------
	function PC_RampMaker()	{
	}


	// Custom Methods
	//--------------------------------------
	
	// This function (called by PC_ObjectHeart) exerts force on a cursor
	function applyForce(i:Number, relx:Number, rely:Number, globalx:Number, globaly:Number):Void {
		
		// Coordinates do not need to be rotated because
		//  we don't care where the cursor touches this object

		// Apply the force, with the right strength in the right direction
		_root.PC_Engine.addForce(i,
			strength *  Math.sin(((__angle + totalRotation(this)) * 2 * Math.PI)/360),
			strength * -Math.cos(((__angle + totalRotation(this)) * 2 * Math.PI)/360),
		targetpath(eventTarget))
	}
		
}