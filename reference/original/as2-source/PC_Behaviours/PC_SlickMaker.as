/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* 
*  PC_SLICKMAKER
* 
* The PC_Slick object does not actually exert 
* forces on cursors. Instead, it is an area with a 
* low surface grip, which causes cursors to lose 
* speed more slowly. Cursors will maintain higher 
* speeds on a Slick object, giving the impression 
* of an slippery ‘icy’ surface.
* 
* Setting the Strength parameter of this object
* to a negative value effectively turns it into a 
* sticky surface, where cursors lose speed more 
* quickly than normal.
* 
****************************************************/

class PC_Behaviours.PC_SlickMaker extends PC_Behaviours.PC_Behaviour {


	// Vars
	//--------------------------------------
	private var __strength:Number;
	private var __directionDependency:String;
	private var __dirDepAngle:Number;

	
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
	function PC_SlickMaker()	{
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
				
			}
			
		} else {

			alignment = 1;
		}
		
		
		cur.surfaceGrip  = 1 - Math.abs((alignment*strength))/((alignment*strength)+2);
		
	}
		
}