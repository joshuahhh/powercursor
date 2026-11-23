/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* 
*  PC_WEDGE
*
* The PC_Wedge is a rather simple object that
* pushes cursors with a constant force. The Wedge
* is a 45 part of a circle, and it pushes cursors
* away from its point, toward its rounded edge.
* Eight wedges could be combined into a round,
* hill-like object.
*
****************************************************/

class PC_Objects.PC_Wedge extends PC_Objects.PC_ReadyMadeObject {


	// Vars
	//--------------------------------------
	private var graphics:MovieClip;
	private var tempshading:MovieClip;
	
	private var visualisation:MovieClip;
	private var shading:MovieClip;

	private var __strength:Number;
	private var __style:String;
	private var __tint:Color;


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
	[Inspectable(type="String", enumeration="None,Wedge,Wedge with shading,Just shading", defaultValue="Wedge with shading", name="Graphics Style", category="Graphics")]
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
	function PC_Wedge()	{
	}


	// Init & Draw methods
	//--------------------------------------
	function init(Void):Void {
		
		// remove the 'preview' graphics that are visible in the authoring environment	
		this.graphics._alpha = 0;
		this.tempshading.swapDepths( this.getNextHighestDepth( ) );
		this.tempshading.removeMovieClip( );
				
		super.init();
	}
	
	function draw(Void):Void {	
		
		// remove the old visualisation & shading

		this.visualisation.removeMovieClip();

		// add a visualisation to this object
		
		var v:MovieClip;
		
		if ( __style == "Wedge" || __style == "Wedge with shading" ) {
			v = this.attachMovie( "PC_Pie", "visualisation", this.getNextHighestDepth( ) );

			// apply a color to the object's visualisation (not needed for None)
		
			var col = new Color( this.visualisation );
			var untypedTint = __tint;
			col.setRGB( untypedTint );
		}
		
		v._x = 0;
		v._y = 0;

		if ( graphicsStyle == "Wedge with shading" || graphicsStyle == "Just shading" ) {

			var s:MovieClip;

			s = this.attachMovie( "PC_Wedge_Shading", "shading", this.getNextHighestDepth( ) );

			s.swapDepths( getNextHighestDepth( ) );
		}

		super.draw( );
	}


	// Custom Methods
	//--------------------------------------
	
	function applyForce(i:Number, relx:Number, rely:Number, globalx:Number, globaly:Number):Void {
		
		var e:MovieClip = _root.PC_Engine;
		
		var rot = totalRotation(this);
		
		// Calculate at what angle (from the wedge's point) the cursor is
		var angle:Number;
		angle = Math.atan(relx/-rely);
		angle = (angle/(2*Math.PI))*360;
		if (rely>0) { angle += 180; }


		var xForce = __strength * 0.4 * Math.sin((angle * 2 * Math.PI)/360);
		var yForce = __strength * 0.4 * Math.cos((angle * 2 * Math.PI)/360);

		xForce *= this._xscale/100;
		yForce *= this._yscale/100;

		var rot:Number = (totalRotation(this)*2*Math.PI)/360;

		e.addForce(i,
			(xForce*Math.cos(rot) + yForce*Math.sin(rot)),
			-(yForce*Math.cos(rot) - xForce*Math.sin(rot)),
		targetpath(eventTarget))

	}

}