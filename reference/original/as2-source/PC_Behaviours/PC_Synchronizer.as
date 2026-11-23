/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* 
*  PC_SYNCHRONIZER
* 
* The PC_Synchronizer is a object that synchronizes
* PowerCursor’s mock cursors with the system cursor.
* This is accomplished by applying forces aimed at
* the system cursor. This will push the cursor
* towards the system cursor until their disparity
* is negligible.
* 
* The subtlety parameter can make the
* synchronization process more unobtrusive, but a
* low strength parameter also goes a long way in
* achieving this.
* 
****************************************************/

class PC_Behaviours.PC_Synchronizer extends PC_Behaviours.PC_Behaviour {


	// Vars
	//--------------------------------------
	private var __strength:Number;
	private var __subtle:Boolean;

	private var xSync:Number;
	private	var ySync:Number;


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
	
	// Subtle
	[Inspectable(type="Boolean", defaultValue=true, name="Subtle", category="Force")]
	public function set subtle(newSubtle:Boolean):Void {
		__subtle = newSubtle;
	}
	public function get subtle():Boolean {
		return __subtle;
	}



	// Constructor
	//--------------------------------------
	function PC_Synchronizer()	{
	}


	// Custom Methods
	//--------------------------------------
	
	// This function (called by PC_ModifierHeart) exerts force on a cursor
	function applyForce(i:Number, relx:Number, rely:Number, globalx:Number, globaly:Number):Void {

		var e:MovieClip = _root.PC_Engine;
		
		var cur:PC_Cursors.PC_Cursor = e.getCursor(i);
		
		var xDisparity:Number = xSync + cur.xLastForceDisp;
		var yDisparity:Number = ySync + cur.yLastForceDisp;
		
		if (!__subtle || Math.abs(cur.xLastMouseDisp)+Math.abs(cur.yLastMouseDisp)>1) {
		
			if (Math.abs(xDisparity)+Math.abs(yDisparity)>1) {
				e.addForce(i,
					__strength * -0.1 * Math.sqrt(Math.abs(xDisparity)) * Math.abs(xDisparity)/xDisparity,
					__strength * -0.1 * Math.sqrt(Math.abs(yDisparity)) * Math.abs(yDisparity)/yDisparity,
				targetpath(eventTarget))
			}
		}

		xSync = cur.xPosition - _root._xmouse;
		ySync = cur.yPosition - _root._ymouse;
		
	}
		
}