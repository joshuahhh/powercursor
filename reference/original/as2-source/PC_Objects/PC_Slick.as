/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* 
*  PC_SLICK
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

class PC_Objects.PC_Slick extends PC_Objects.PC_ReadyMadeObject {


	// Vars
	//--------------------------------------
	private var graphics:MovieClip;
	private var tempshading:MovieClip;

	private var visualisation:MovieClip;
	private var shading:MovieClip;

	private var __strength:Number;
	private var __style:String;
	private var __tint:Color;
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

	// Graphics: These vars set the object's graphical properties.
	[Inspectable(type="String", enumeration="None,Square,Icy", defaultValue="Icy", name="Graphics Style", category="Graphics")]
	public function set style(newStyle:String):Void {
		__style = newStyle;
		draw();
	}
	public function get style():String {
		return __style;
	}

	[Inspectable(type="Color", defaultValue="#DD2424", name="Graphics Tint", category="Graphics")]
	public function set tint(newTint:Color):Void {
		__tint = newTint;
		draw();
	}
	public function get tint():Color {
		return __tint;
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
	function PC_Slick()	{
	}


	// Init & Draw methods, req'd for Flash
	//--------------------------------------
	function init(Void):Void {
		
		// remove the 'preview' graphics that are visible in the authoring environment
		this.graphics._alpha = 0;
				
		super.init();
	}
	
	function draw(Void):Void {	
		
		// remove the old visualisation & shading

		this.visualisation.removeMovieClip();
		this.shading.removeMovieClip();

		// add a new visualisation to this object
		
		var v:MovieClip;
		
		if (__style == "Square" || __style == "Icy") {
			v = this.attachMovie("PC_Square", "visualisation", this.getNextHighestDepth());

			// apply a color to the object's visualisation
		
			var col = new Color(this.visualisation);
			var untypedTint = __tint;
			col.setRGB(untypedTint);
			
			v._x = v._width/2;
			v._y = v._height/2;


		}
		
		if (__style = "Icy") {

			var s:MovieClip;

			s = this.attachMovie("PC_Slick", "shading", this.getNextHighestDepth());

			s.swapDepths(getNextHighestDepth());
			s._x = s._width/2;
			s._y = s._height/2;
			
		}
		

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
				
			}
			
		} else {

			alignment = 1;
		}
		
		
		cur.surfaceGrip  = 1 - Math.abs((alignment*strength))/((alignment*strength)+2);
		
	}

}