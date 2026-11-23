/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* 
*  PC_ROUNDREADYMADEOBJECT
* 
* The PC_RoundReadyMadeObject is a parent class for
* the Hill, Hole and Twister objects, and was 
* created because those objects (due to their 
* similar shape) had a lot of code in common.
* The PC_RoundReadyMadeObject also handles the
* pc_plateau event, which is triggered when a 
* cursor hits the objects’ centre (its ‘hilltop’ 
* or ‘floor’).
* 
****************************************************/

class PC_Objects.PC_RoundReadyMadeObject extends PC_Objects.PC_ReadyMadeObject {


	[Event("pc_plateau")]


	// Vars
	//--------------------------------------
	
	private var graphics:MovieClip;
	private var templight:MovieClip;
	private var tempshade:MovieClip;

	private var visualisation:MovieClip;
	private var shadinglight:MovieClip;
	private var shadingshade:MovieClip;

	private var __tint:Color;
	private var __style:String;
	private var __shape:String;
	private var __strength:Number;
	private var __plateau:Number;


	// Inspectables
	//--------------------------------------
	
	// Strength indicates how much force this object applies.
	// Increase this to push or pull cursors with more force.
	[Inspectable(type="Number", defaultValue=3, name="Force Strength", category="Force")]
	public function set strength(newStrength:Number):Void {
		__strength = newStrength;
	}
	public function get strength():Number {
		return __strength;
	}

	// The Plateau is the force-free hilltop (or floor bottom) in
	// the center of the object. This parameter determines its size, 
	// in % of the total diameter. Set to 0 to disable the plateau.
	[Inspectable(type="Number", defaultValue=20, name="Force Plateau Diam.", category="Force")]
	public function set plateauDiameter(newDiameter:Number):Void {
		__plateau = newDiameter;
	}
	public function get plateauDiameter():Number {
		return __plateau;
	}

	// The shape of the hill or hole. V-shaped indicates a constant 
	// slope, U-shaped an exponential slope. A Sine-shaped hill is 
	// sloped as a sine-wave (resulting in a smooth shape).
	[Inspectable(type="String", enumeration="V-shaped,U-shaped,Sine-shaped", defaultValue="U-shaped", name="Force Shape", category="Force")]
	public function set shape(newShape:String):Void {
		__shape = newShape;
	}
	public function get shape():String {
		return __shape;
	}

	// The graphical style of the object determines how the
	// object should be drawn: Nothing, a open circle or a
	// filled circle (disc), and with or without shading.
	[Inspectable(type="String", enumeration="None,Circle,Disc,Just shading,Circle with shading,Disc with shading", defaultValue="Disc with shading", name="Graphics Style", category="Graphics")]
	public function set style(newStyle:String):Void {
		__style = newStyle;
		draw();
	}
	public function get style():String {
		return __style;
	}

	
	// Constructor
	//--------------------------------------
	function PC_RoundReadyMadeObject()	{
	}


	// Init & Draw methods, req'd for Flash
	//--------------------------------------
	function init(Void):Void {
		
		// remove the 'preview' graphics that are visible in the authoring environment
		this.graphics._alpha = 0;
		this.templight.swapDepths(this.getNextHighestDepth());
		this.templight.removeMovieClip();
		this.tempshade.swapDepths(this.getNextHighestDepth());
		this.tempshade.removeMovieClip();
		
		super.init();
	}
	
	function draw(Void):Void {	

		// remove the old visualisation & shading

		this.visualisation.removeMovieClip();
		this.shadingshade.removeMovieClip();
		this.shadinglight.removeMovieClip();

		// add a visualisation to this object, depending on graphics style
		
		var v:MovieClip;
		
		if (style == "Circle" || style == "Circle with shading") {
			v = this.attachMovie("PC_Circle", "visualisation", this.getNextHighestDepth());

		} else {
		
		if (style == "None" || style == "Just shading") {
			
		} else {
			v = this.attachMovie("PC_Disc", "visualisation", this.getNextHighestDepth());

		}}
		
		v._x = v._width/2;
		v._y = v._height/2;


		// apply a color to the object's visualisation.
		
		var col = new Color(this.visualisation);
		var untypedTint = __tint;
		col.setRGB(untypedTint);


		// add shading; shade & light areas
		
		if (style == "Disc with shading" || style == "Circle with shading" || style == "Just shading") {
			
			this.attachMovie("PC_Round_Light", "shadinglight", this.getNextHighestDepth());
			this.attachMovie("PC_Round_Shade", "shadingshade", this.getNextHighestDepth());

			if (strength < 0) {
				
				// Rotate the shade & light areas to make the hill a hole
	
				this.shadingshade._rotation += 180;
				this.shadingshade._x += 100;
				this.shadingshade._y += 100;
	
				this.shadinglight._rotation += 180;
				this.shadinglight._x += 100;
				this.shadinglight._y += 100;
			}
			
		}
		

		// Calculate the scale and offset for the disc (for plateau visualisation)

		var xs = __plateau/100;
		var ys = __plateau/100;
		var xo = (100-__plateau)/2;
		var yo = (100-__plateau)/2;
		
		
		// create a new MovieClip to draw the plateau disc in

		var disc = this.createEmptyMovieClip("edge", this.getNextHighestDepth());
		
		disc.swapDepths(getNextHighestDepth());
		
		with ( disc ) {		
			
			// the plateau is white at 10% alpha
			beginFill(0xFFFFFF, 10);

			// draw the plateau disc
			moveTo ( 50*xs+xo,100*ys+yo );
			curveTo( 97*xs+xo, 97*ys+yo,100*xs+xo, 50*ys+yo );
			curveTo( 97*xs+xo,  3*ys+yo, 50*xs+xo,  0*ys+yo );
			curveTo(  3*xs+xo,  3*ys+yo,  0*xs+xo, 50*ys+yo );
			curveTo(  3*xs+xo, 97*ys+yo, 50*xs+xo,100*ys+yo );
			
			endFill();
		}	
		
		super.draw();
	}
}