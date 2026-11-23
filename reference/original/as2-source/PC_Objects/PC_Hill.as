/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* 
*  PC_HILL
* 
* The PC_Hill is an circular object that pushes
* cursors away from its centre. A round, force-free
* ‘hilltop’ can be created in its centre using the
* Plateau Diameter parameter. Depending on its
* Strength, the Hill can push harder or weaker,
* and the shape parameter determines how its force
* changes with distance from the centre. 
* 
****************************************************/

class PC_Objects.PC_Hill extends PC_Objects.PC_RoundReadyMadeObject {


	// Inspectables
	//--------------------------------------

	// Tint is the colour of the object’s circle or disc.
	[Inspectable(type="Color", defaultValue="#DD2424", name="Graphics Tint", category="Graphics")]
	public function set tint(newTint:Color):Void {
		__tint = newTint;
		draw();
	}
	public function get tint():Color {
		return __tint;
	}


	// Constructor
	//--------------------------------------
	function PC_Hill()	{
	}


	// Custom Methods
	//--------------------------------------
	
	function applyForce(i:Number, relx:Number, rely:Number, globalx:Number, globaly:Number):Void {
		
		var e:MovieClip = _root.PC_Engine;
		
		// Center relative coordinates on hilltop
		relx -= 50;
		rely -= 50;
		
		// Calculate at what angle (from the center) the cursor is
		var angle:Number;
		angle = Math.atan(relx/-rely);
		angle = (angle/(2*Math.PI))*360;
		if (rely>0) { angle += 180; }


		if (Math.sqrt((relx*relx) + (rely*rely)) > (__plateau/2)) {
			

			if(shape=="V-shaped") {
				// if V-shaped, slope is put to 4 or -4 (constant slope)
				var slope = 4;
			} else {
				if(shape=="U-shaped") {
					// if U-shaped, distance from center is used for slope (round slope)
					var slope = 0.12 * Math.sqrt((relx*relx) + (rely*rely));
				} else {
					// if Sine-shaped, slope is like half sine function
					var slope = 5 * Math.sin(Math.sqrt((relx*relx) + (rely*rely)) * Math.PI/51);
				}
			}
			
			// Apply the force, with the right strength in the right direction
			e.addForce(i,
				 __strength * (slope/10) * Math.sin(((angle) * 2 * Math.PI)/360),
				-__strength * (slope/10) * Math.cos(((angle) * 2 * Math.PI)/360),
			targetpath(eventTarget))

		} else  {
			
			e.dispatchPCEvent(i, eventTarget, "pc_plateau");

			// Apply an empty force
			e.addForce(i,
				0,
				0,
			targetpath(eventTarget))
			
		}
	}

	
}