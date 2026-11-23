/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
*
*  PC_DIMMER
*
* 
****************************************************/

class PC_Objects.PC_Dimmer extends PC_Objects.PC_ReadyMadeObject {


	// Vars
	//--------------------------------------
	private var graphics:MovieClip;
	private var visualisation:MovieClip;

	private var __tint:Color;

	private var __dimfactor:Number;
	private var __scope:String;
	private var __directionDependency:String;
	private var __dirDepAngle:Number;


	// Inspectables
	//--------------------------------------

	// Tint is the colour of the object’s rectangle.
	[Inspectable(type="Color", defaultValue="#EEABAB", name="Graphics Tint", category="Graphics")]
	public function set tint(newTint:Color):Void {
		__tint = newTint;
		draw();
	}
	public function get tint():Color {
		return __tint;
	}
	
	// Dimming factor: 
	[Inspectable(type="Number", defaultValue=0, name="Dim to ... (%)", category="Force")]
	public function set dimmingFactor(newFactor:Number):Void {
		__dimfactor = newFactor;
	}
	public function get dimmingFactor():Number {
		return __dimfactor;
	}
	
	// Global/Local/Mouse: Whether this dimmer dims only its siblings or all objects
	[Inspectable(type="String", enumeration="Global forces,Local forces,Mouse", defaultValue="Global forces", name="Scope")]
	public function set scope(newScope:String):Void {
		if (newScope.toLowerCase() == "global forces" || newScope.toLowerCase() == "global") {
			__scope = "Global";
		} else {
			if (newScope.toLowerCase() == "mouse") {
				__scope = "Mouse";
			} else {
				if (newScope.toLowerCase() == "local forces" || newScope.toLowerCase() == "local") {
				__scope = "Local";
				}
			}
		}		
	}
	public function get scope():String {
		return __scope;
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
	function PC_Dimmer()	{
	}
	
	
	// Init & Draw methods
	//--------------------------------------
	function init(Void):Void {
		
		// remove the 'preview' graphics that are visible in the authoring environment
		this.graphics._alpha = 0;

		super.init();
	}
	
	
	function draw(Void):Void {	
		
		// remove the old visualisation & shading
		this.visualisation.removeMovieClip();

		// add a visualisation to this object		
		var v:MovieClip = this.attachMovie( "PC_Square", "visualisation", this.getNextHighestDepth( ) );

		// apply a color to the object's visualisation		
		var col = new Color(this.visualisation);
		var untypedTint = __tint;
		col.setRGB(untypedTint);
		
		v._width  = this.graphics._width;
		v._height = this.graphics._height;
		
		v._x = v._width/2;
		v._y = v._height/2;


		super.draw();
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

		e.addDimmer(i, 100-((100-__dimfactor)*alignment), __scope, targetpath(eventTarget));
	}

}