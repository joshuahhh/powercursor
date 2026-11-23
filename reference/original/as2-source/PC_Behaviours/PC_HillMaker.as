/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* 
*  PC_HILLMAKER
* 
* The PC_HillMaker is a modifier with an effect
* similar to the PC_Hill object. Because the
* PC_Hill object is of a fixed size, it can
* displace the cursor according to various
* interesting slope-shapes, but the HillMaker
* does not have that advantage. Therefore, the
* PC_HillMaker simply detects (through trial-
* and-error) the nearest edge and pushes the 
* cursor in that direction.
* 
* Because the HillMaker has to search for the
* nearest edge every frame in a rather inefficient
* way, it is a quite calculation-intensive
* component. Having numerous HillMaker objects
* with several cursors touching them may lead
* to performance issues. 
* 
****************************************************/

class PC_Behaviours.PC_HillMaker extends PC_Behaviours.PC_Behaviour {


	// Vars
	//--------------------------------------
	private var __strength:Number;


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


	// Constructor
	//--------------------------------------
	function PC_HillMaker()	{
	}


	// Custom Methods
	//--------------------------------------
	
	// This function (called by PC_ModifierHeart) exerts force on a cursor
	function applyForce(i:Number, relx:Number, rely:Number, globalx:Number, globaly:Number):Void {

		var e:MovieClip = _root.PC_Engine;
		
		var scanx:Number;
		var scany:Number;
		var angl:Number = 0;
		var dist:Number = 0.5;
		
		var miss:Boolean = false;
		
		var c = 0;
		
		var maxRange:Number = Math.min(_parent._width, _parent._height) / 2;
		var angleInc:Number = (2*Math.PI) / 36; // 10 degree hops
		
		while (miss==false && dist < maxRange) {
			
			scanx = globalx + (Math.sin(angl) * dist);
			scany = globaly - (Math.cos(angl) * dist);
								
			if (!_parent.hitTest(scanx, scany, true) ) {

				miss = true;
								
			} else {

				angl += angleInc;
				dist *= 1.01;
			}
		}
		
		e.addForce(i,
			 __strength * (dist+5)/50 * Math.sin(angl),
			-__strength * (dist+5)/50 * Math.cos(angl),
		targetpath(eventTarget))
		
	}
		
}