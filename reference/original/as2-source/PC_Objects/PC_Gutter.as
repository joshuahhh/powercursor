/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* 
*  PC_GUTTER
* 
* The PC_Gutter is a rectangular area which draws 
* cursors towards its bottom, which is its centre 
* line. In this respect, it works like a hole, but 
* in only one dimension instead of two. The Gutter 
* is useful for guiding cursors along a line. If 
* the Gutter’s Strength parameter were to be set 
* to a negative value, the Gutter would turn into 
* a sort of wall. 
* 
****************************************************/

class PC_Objects.PC_Gutter extends PC_Objects.PC_ReadyMadeObject {


	[Event("pc_plateau")]


	// Vars
	//--------------------------------------
	private var graphics:MovieClip;
	private var tempshading:MovieClip;

	private var visualisation:MovieClip;
	private var shading:MovieClip;

	private var __tint:Color;
	private var __style:String;
	private var __shape:String;
	private var __strength:Number;
	private var __plateau:Number;	

	
	// Strength: A general indication of how much force this object applies
	[Inspectable(type="Number", defaultValue=3, name="Force Strength", category="Force")]
	public function set strength(newStrength:Number):Void {
		__strength = newStrength;
	}
	public function get strength():Number {
		return __strength;
	}


	// The Plateau is the force-free gutter bottom in the center
	// of the object. This parameter determines its size, in %
	// of the total width. Set to 0 to disable the plateau.
	[Inspectable(type="Number", defaultValue=20, name="Force Plateau Diam.", category="Force")]
	public function set plateauDiameter(newDiameter:Number):Void {
		__plateau = newDiameter;
	}
	public function get plateauDiameter():Number {
		return __plateau;
	}
	
	// Shape: The shape of the hill's slope: straight (V) or curved (U)
	[Inspectable(type="String", enumeration="V-shaped,U-shaped,Sine-shaped", defaultValue="U-shaped", name="Force Shape", category="Force")]
	public function set shape(newShape:String):Void {
		__shape = newShape;
	}
	public function get shape():String {
		return __shape;
	}

	// Graphics: These vars set the object's graphical properties.
	[Inspectable(type="String", enumeration="None,Rectangle,Block,Just shading,Rectangle with shading,Block with shading", defaultValue="Block with shading", name="Graphics Style", category="Graphics")]
	public function set graphicsStyle(newStyle:String):Void {
		__style = newStyle;
		draw();
	}
	public function get graphicsStyle():String {
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
	
	

	// Constructor
	//--------------------------------------
	function PC_Gutter()	{
	}


	// Init & Draw methods
	//--------------------------------------
	function init(Void):Void {
		
		this.graphics._alpha = 0;
		this.tempshading.swapDepths(this.getNextHighestDepth());
		this.tempshading.removeMovieClip();

		super.init();
	}

	function draw(Void):Void {	
		
		// remove the old visualisation & shading

		this.visualisation.removeMovieClip();
		this.shading.removeMovieClip();

		// add a visualisation to this object

		var v:MovieClip;
		
		if (__style == "Rectangle" || __style == "Rectangle with shading") {
			v = this.attachMovie("PC_Gutter_Rectangle", "visualisation", getNextHighestDepth());
		} else {
		
		if (__style == "None" || __style == "Just shading") {
			
		} else {
			v = this.attachMovie("PC_Gutter_Block", "visualisation", getNextHighestDepth());
		}}
		v._x = v._width/2;
		v._y = v._height/2;

		
		// apply a color to the object's visualisation.
		
		var col = new Color(this.visualisation);
		var untypedTint = __tint;
		col.setRGB(untypedTint);

		if (graphicsStyle == "Block with shading" || graphicsStyle == "Rectangle with shading" || graphicsStyle == "Just shading") {

			var s:MovieClip;

			s = this.attachMovie("PC_Gutter_Shading", "shading", this.getNextHighestDepth());

			s.swapDepths(getNextHighestDepth());
			s._x = s._width/2;
			s._y = s._height/2;

		}

		super.draw();
	}


	// Custom Methods
	//--------------------------------------

	// This function (called by PC_ObjectHeart) exerts force on a cursor
	function applyForce(i:Number, relx:Number, rely:Number, globalx:Number, globaly:Number):Void {

		var e:MovieClip = _root.PC_Engine;

		var rot:Number = (totalRotation(this)*2*Math.PI)/360;
		
		// Center relative coordinates on center (gutter bottom).
		// relx -= 100; 
		rely -= 12.5;

		// Because coordinates are centered on gutterbottom, rely = distance from center line.

		if (Math.abs(rely) > (__plateau/16)) {

			if (shape=="V-shaped") {
				// if V-shaped, slope is put to 4 or -4 (constant slope)
				var slope = 4 * (rely/Math.abs(rely));
			} else {
				if(shape=="U-shaped") {
					// if U-shaped, distance from center is used for slope (round slope)
					var slope = rely/2;
				} else {
					// if Sine-shaped, slope is like half sine function
					var slope = 5 * Math.sin(rely * Math.PI/12.5);
				}
			}
			
		} else  {
			
			slope = 0;
			e.dispatchPCEvent(i, eventTarget, "pc_plateau");
	
		}
		
		// Apply the force, with the right strength in the right direction
		_root.PC_Engine.addForce(i,
			 __strength * slope/8 * Math.sin(rot),
			-__strength * slope/8 * Math.cos(rot),
		targetpath(eventTarget))

	}
		
}