/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* V1.1, August 2007, by Mensvoort/de Man
*
*  PC_RAMP
* 
* The PC_Ramp is a very basic object, which simply 
* pushes cursors away in a certain direction with 
* constant force. This direction is specified by an 
* angle parameter (in degrees). It is relative to 
* the object, so when a ramp is rotated, it will 
* push cursors in a different direction as well.
* 
****************************************************/

class PC_Objects.PC_Ramp extends PC_Objects.PC_ReadyMadeObject {


	// Vars
	//--------------------------------------
	private var graphics:MovieClip;
	private var tempshading:MovieClip;
	
	private var shading:MovieClip;
	private var visualisation:MovieClip;

	private var __strength:Number;
	private var __angle:Number;
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

	// Angle: In which direction cursors should be pushed
	[Inspectable(type="Number", defaultValue=0, name="Force Angle", category="Force")]
	public function set angle(newAngle:Number):Void {
		__angle = newAngle;
	}
	public function get angle():Number {
		return __angle;
	}


	// Graphics: These vars set the object's graphical properties.
	[Inspectable(type="String", enumeration="None,Square,Square with shading,Just shading", defaultValue="Square with shading", name="Graphics Style", category="Graphics")]
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
	function PC_Ramp()	{
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
	
	function draw( Void ):Void {	
		
		// remove the old visualisation & shading

		this.visualisation.removeMovieClip( );
		this.shading.removeMovieClip( );

		// add a visualisation to this object

		var v:MovieClip;
		
		if ( __style == "Square" || __style == "Square with shading" ) {
			v = this.attachMovie( "PC_Square", "visualisation", getNextHighestDepth( ) );
		}
		
		v._x = v._width  / 2;
		v._y = v._height / 2;

		
		// apply a color to the object's visualisation.
		
		var col = new Color( this.visualisation );
		var untypedTint = __tint;
		col.setRGB( untypedTint );

		if ( graphicsStyle == "Square with shading" || graphicsStyle == "Just shading" ) {

			var s:MovieClip;

			s = this.attachMovie( "PC_Ramp_Shading", "shading", this.getNextHighestDepth( ) );

			if ( __angle % 90 != 0 ) {				
			
				var numModW = Math.cos( ( __angle % 90 ) * ( Math.PI / 180 ) );
				var numModH = Math.sin( ( __angle % 90 ) * ( Math.PI / 180 ) );
				var numMultiplier = numModW + numModH;	
				
				s._width  = v._width * numMultiplier;			
				s._height = v._width * numMultiplier;
				
				var m:MovieClip;
				m = this.attachMovie( "PC_Square", "mask", this.getNextHighestDepth( ) );
				m._x = m._width  / 2;
				m._y = m._height / 2;

				s.setMask( m );
			}

			s.swapDepths( getNextHighestDepth( ) );
			s._rotation = __angle;
			s._x = v._width / 2; //s._width  / 2;
			s._y = v._height / 2;
		}

		super.draw( );
	}


	// Custom Methods
	//--------------------------------------
	
	// This function (called by PC_ObjectHeart) exerts force on a cursor
	function applyForce(i:Number, relx:Number, rely:Number, globalx:Number, globaly:Number):Void {
		
		// Coordinates do not need to be rotated because
		//  we don't care where the cursor touches this object

		// Apply the force, with the right strength in the right direction
		_root.PC_Engine.addForce(i,
			strength *  Math.sin(((__angle + totalRotation(this)) * 2 * Math.PI)/360),
			strength * -Math.cos(((__angle + totalRotation(this)) * 2 * Math.PI)/360),
		targetpath(eventTarget))
	}
		
}