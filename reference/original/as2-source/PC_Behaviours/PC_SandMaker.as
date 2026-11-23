/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* 
*  PC_SANDMAKER
* 
* The PC_SandMaker works exactly like
* the PC_Sand object, except that the 
* RoughMaker has no surface itself but applies the
* roughness to another symbol. It can be used to 
* simulate a sandy or sticky texture. It has both 
* a Roughness and a Stickyness parameter: the first 
* controls the semi-random forces this object 
* applies to the cursor, the second governs the 
* additional speed decrease this object imposes.
* 
* The forces this object applies should hinder the 
* cursor when it moves, but be absent when the 
* cursor is still. To achieve this, the force 
* calculated is in proportion to the cursor’s 
* current speed and in the opposite direction. 
* Because a random factor is added as well, the 
* exact force applied is different per frame,
* which suggests a rough texture.
* 
****************************************************/

class PC_Behaviours.PC_SandMaker extends PC_Behaviours.PC_Behaviour {


	// Vars
	//--------------------------------------
	private var __strengthRoughness:Number;
	private var __strengthStickyness:Number;
	
	private var __directionDependency:String;
	private var __dirDepAngle:Number;

	
	// Inspectables
	//--------------------------------------

	// Strength: A general indication of how much force this object applies
	[Inspectable(type="Number", defaultValue=3, name="Strength (Roughness)", category="Force")]
	public function set strengthRoughness(newStrengthRoughness:Number):Void {
		__strengthRoughness = newStrengthRoughness;
	}
	public function get strengthRoughness():Number {
		return __strengthRoughness;
	}

	[Inspectable(type="Number", defaultValue=3, name="Strength (Stickyness)", category="Force")]
	public function set strengthStickyness(newStrengthStickyness:Number):Void {
		__strengthStickyness = newStrengthStickyness;
	}
	public function get strengthStickyness():Number {
		return __strengthStickyness;
	}

	// Direction dependecy
	[Inspectable(type="String", enumeration="None,One-way,Two-way", defaultValue="None", name="Direction dependency", category="Force")]
	public function set directionDependency(newDirectionDependency:String):Void {
		if (newDirectionDependency.toLowerCase() == "one-way") {
			__directionDependency = "One-way";
		} else {
			if (newDirectionDependency.toLowerCase() == "two-way") {
				__directionDependency = "Two-way";
			} else {
				__directionDependency = "None"
			}
		}
	}
	public function get directionDependency():String {
		return __directionDependency;
	}
	
	[Inspectable(type="Number", defaultValue=0, name="Dir. dep. angle", category="Force")]
	public function set dirDepAngle(newDirDepAngle:Number):Void {
		__dirDepAngle = newDirDepAngle;
	}
	public function get dirDepAngle():Number {
		return __dirDepAngle;
	}

	
	
	// Constructor
	//--------------------------------------
	function PC_SandMaker()	{
	}


	// Custom Methods
	//--------------------------------------
	
	function applyForce(i:Number, relx:Number, rely:Number, globalx:Number, globaly:Number):Void {

		var e:MovieClip = _root.PC_Engine;

		var cur:PC_Cursors.PC_Cursor = e.getCursor(i);

		var vx = cur.xLastDisp;
		var vy = cur.yLastDisp;


		// Alignment is how well the mouse movement lines up with
		//  the direction dependancy angle.
		//   1 = same angle, object's full effect applies
		//   0 = opposite angle, object's effect nullified
		var alignment:Number;	

		if (__directionDependency != "None") {
		
			var angle:Number;
			
			angle = Math.atan(vx/-vy);
			angle = (angle/(2*Math.PI))*360;
			if (vy>0) { angle += 180; }
			
			if (isNaN(angle)) {
				alignment = 1;
			} else {
			
				// Calculate alignment based on angle difference
				
				var angleDiff:Number;
				angleDiff = Math.abs(angle - (__dirDepAngle % 360));
				
				if (__directionDependency == "One-way") {
					
					if (angleDiff>180) {angleDiff = 360 - angleDiff}; 

					// Scale to 0-1
					angleDiff *= 1/180;
				
				} else { // __directionDependency == Two-way
			
					if (angleDiff>180) {angleDiff = angleDiff - 180}; 
					if (angleDiff>90) {angleDiff = 180 - angleDiff}; 

					// Scale to 0-1
					angleDiff *= 1/90;
				}
				
				// Zero angle difference means full alignment
				alignment = 1 - angleDiff;

				alignment = Math.sqrt(alignment);
				
			}
			
		} else {

			alignment = 1;
		}



		// Add a force proportional to the cursor's current speed,
		//  but in the opposite direction. The exact strength
		//  is randomized per frame to emulate a rough texture.

		var rough = Math.max(Math.min((vx+vy)/2, 3), -3);

		e.addForce(i,
			__strengthRoughness * (vx+vx+vx+vy)/8 * (Math.random() - 0.8),
			__strengthRoughness * (vx+vy+vy+vy)/8 * (Math.random() - 0.8),
		targetpath(eventTarget))


		cur.surfaceGrip = 1 + __strengthStickyness/3;


	}

}