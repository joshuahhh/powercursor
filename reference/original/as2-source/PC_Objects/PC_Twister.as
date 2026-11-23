/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
*
*  PC_TWISTER
*
* The PC_Twister acts much like a Hill or Hole, but 
* instead of affecting cursors straight to or from 
* its centre, it spins them around. This can give a 
* ‘drainy’ effect, where cursors twirl down the 
* vortex like water down a drain. This can be 
* especially useful in combination with the 
* 'pc_plateau'-event, which is activated whenever a 
* cursor hits the Twister’s centre – in other 
* words, the bottom of the drain.
* 
****************************************************/

class PC_Objects.PC_Twister extends PC_Objects.PC_RoundReadyMadeObject {


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


	// Vars
	//--------------------------------------

	private var vortex:MovieClip;
	private var tempvortex:MovieClip;

	private var __vortexstyle:String;
	private var __spin:String;


	// Inspectables
	//--------------------------------------

	// Spin indicates whether the twister pulls cursors in 
	// or pushes them out, and in what direction. This is
	// based on default ArrowCursors;  depending on certain 
	// parameters, such as very low grip,  a cursor might
	// be pushed out even by a pulling twister.
	[Inspectable(type="String", enumeration="Left In,Left Out,Right In,Right Out", defaultValue="Right In", name="Force Spin", category="Force")]
	public function set spin(newSpin:String):Void {
		__spin = newSpin;
		draw();
	}
	public function get spin():String {
		return __spin;
	}

	// The visualisation for the twister’s vortex can be set 
	// with this parameter. Note that the vortex’s animation 
	// speed does not match the cursors’ spinning speed, as 
	// this speed can be different for different cursors.
	[Inspectable(type="String", enumeration="None,Still,Animated", defaultValue="Still", name="Graphics Vortex", category="Graphics")]
	public function set vortexStyle(newStyle:String):Void {
		__vortexstyle = newStyle;
		draw();
	}
	public function get vortexStyle():String {
		return __vortexstyle;
	}


	// Constructor
	//--------------------------------------
	function PC_Twister()	{
	}


	// Init & Draw methods, req'd for Flash
	//--------------------------------------
	function init(Void):Void {

		// remove the 'preview' graphics that are visible in the authoring environment
		this.tempvortex.swapDepths(this.getNextHighestDepth());
		this.tempvortex.removeMovieClip();

		super.init();

	}

	function draw(Void):Void {

		super.draw();
		
		// remove the old vortex
		this.vortex.removeMovieClip();

		// and add a vortex to this object
		var vx:MovieClip;
		var dir:String;

		if (__spin == "Left In" || __spin == "Left Out") {
			dir = "L";
		} else {
			dir = "R";
		}

		if (__vortexstyle == "Animated") {
			vx = this.attachMovie("PC_Twister_AniVortex"+dir, "vortex", this.getNextHighestDepth());
		} else {

		if (__vortexstyle == "None") {

		} else {
			vx = this.attachMovie("PC_Twister_Vortex"+dir, "vortex", this.getNextHighestDepth());

		}}

		vx._x = 1+vx._width/2;
		vx._y = 1+vx._height/2;

	}


	// Custom Methods
	//--------------------------------------
	
	// This function (called by PC_ObjectHeart) exerts force on a cursor
	function applyForce(i:Number, relx:Number, rely:Number, globalx:Number, globaly:Number):Void {
		
		var e:MovieClip = _root.PC_Engine;

		// Center relative coordinates on hilltop
		relx -= 50;
		rely -= 50;
		
		// Calculate at what angle (from the center) the cursor is
		var angle:Number;
		angle = Math.atan(relx/-rely)
		angle = (angle/(2*Math.PI))*360;
		if (rely>0) { angle += 180; }

		// calculate at what distance from the center the cursor is
		var dist:Number = Math.sqrt((relx*relx) + (rely*rely));


		if (dist > (__plateau/2)) {
			
			
			if(shape=="V-shaped") {
				// if V-shaped, slope is put to 4 or -4 (constant slope)
				var slope = 4;
			} else {
				if(shape=="U-shaped") {
					// if U-shaped, distance from center is used for slope (round slope)
					var slope = 0.12 * dist;
				} else {
					// if Sine-shaped, slope is like half sine function
					var slope = 5 * Math.sin(dist) * Math.PI/51;
				}
			}
			
			// spinboost: spin should be stronger near center,
			//        and also stronger for high-force twisters

			var spinboost:Number = Math.pow((50-dist)/20, 2) * __strength;
			
			switch (__spin) {
				case "Left In":	  angle += -100 - spinboost; break;
				case "Left Out":  angle +=  -88 + spinboost; break;
				case "Right In":  angle += +100 + spinboost; break;
				case "Right Out": angle +=  +88 - spinboost; break;
				default:          angle += +100 + spinboost;
			}
					
			var xForce = __strength * (slope/10) * Math.sin((angle * 2 * Math.PI)/360);
			var yForce = __strength * (slope/10) * Math.cos((angle * 2 * Math.PI)/360);
			
			xForce *= this._xscale/100;
			yForce *= this._yscale/100;

			var rot:Number = (totalRotation(this)*2*Math.PI)/360;

			e.addForce(i,
				(xForce*Math.cos(rot) + yForce*Math.sin(rot)),
				-(yForce*Math.cos(rot) - xForce*Math.sin(rot)),
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