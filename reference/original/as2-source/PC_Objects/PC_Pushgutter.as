/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* 
*  PC_PUSHGUTTER
* 
* The PC_PushGutter draws cursors in like a normal 
* Gutter, but it also pushes cursors along its 
* length. It even keeps pushing cursors along when 
* they are on the gutter’s bottom (plateau). The 
* PushGutter’s two effects – to draw cursors in and 
* to push cursors along – use different strength 
* settings. To indicate in which direction cursors 
* will be forced, arrows can be displayed on the 
* PushGutter.
* 
****************************************************/

class PC_Objects.PC_Pushgutter extends PC_Objects.PC_Gutter {


	// Vars
	//--------------------------------------
	
	private var arrows:MovieClip;
	private var temparrows:MovieClip;

	private var __arrowstyle:String;
	private var __pushstrength:Number;

	
	// Push Strength is the strength with which the PushGutter 
	// moves cursors along its length. This operates
	// independently of the PushGutter’s normal ‘gutter’ strength.
	[Inspectable(type="Number", defaultValue=3, name="Push Strength", category="Force")]
	public function set pushStrength(newStrength:Number):Void {
		__pushstrength = newStrength;
	}
	public function get pushStrength():Number {
		return __pushstrength;
	}

	// The visualisation for the PushGutter’s arrows can be set 
	// with this parameter. Note that the arrows’ animation speed 
	// does not match the cursors’ pushed speed, as this speed 
	// can be different for different cursors.
	[Inspectable(type="String", enumeration="None,Still,Animated", defaultValue="Still", name="Graphics Arrows", category="Graphics")]
	public function set arrowStyle(newStyle:String):Void {
		__arrowstyle = newStyle;
		draw();
	}
	public function get arrowStyle():String {
		return __arrowstyle;
	}



	// Constructor
	//--------------------------------------
	function PC_Pushgutter()	{
	}


	// Init & Draw methods, req'd for Flash
	//--------------------------------------
	function init(Void):Void {
		
		// remove the 'preview' graphics that are visible in the authoring environment
		this.temparrows.swapDepths(this.getNextHighestDepth());
		this.temparrows.removeMovieClip();

		super.init();
	}



	function draw(Void):Void {

		super.draw();

		// remove the old visualisation & shading
		this.arrows.removeMovieClip();

	
		// add arrows to this object
		var ar:MovieClip;
		
		if (arrowStyle == "Animated") {
			ar = this.attachMovie("PC_Gutter_AniArrows", "arrows", getNextHighestDepth());

			ar._x = ar._width/2;
			ar._y = ar._height/2;

		} else {
		
		if (arrowStyle == "None") {
			
		} else {
			ar = this.attachMovie("PC_Gutter_Arrows", "arrows", getNextHighestDepth());

			ar._x = ar._width * 9/16;
			ar._y = ar._height * 3/5;
			
		}}

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
			( __strength * slope * 0.15 * Math.sin(rot)) + (__pushstrength*Math.cos(rot) / 2),
			(-__strength * slope * 0.15 * Math.cos(rot)) + (__pushstrength*Math.sin(rot) / 2),
		targetpath(eventTarget))

	}
		
}