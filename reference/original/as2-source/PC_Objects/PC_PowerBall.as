/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* 
*  PC_FREEBALLCURSOR
* 
* The FreeBallCursor is a cursor that looks like a 
* round ball. By default, all balls bounce off each 
* other, but this behaviour can be disabled in the 
* PC_Engine. As opposed as to the ArrowCursor, the 
* BallCursor interprets mouse movement as forces by 
* default.
* 
****************************************************/

class PC_Objects.PC_PowerBall extends PC_Cursors.PC_Cursor {


	// Vars
	//--------------------------------------
	private var graphics:MovieClip;

	private var __isball:Boolean = true;
	private var __mouselink:Boolean = false;
	private var __mouseasforce:Boolean = true;

	private var __tint:Color;
	private var col:Color;


	// Graphics: These vars set the object's graphical properties.
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
	function PC_PowerBall() {
		
	}
	

	// Init & Draw methods
	//--------------------------------------
	function init(Void):Void {	
		
		// the graphics-symbol of this cursor is this class' own symobol
		graphics_mc = this;
		
		super.init();
	}


	function draw(Void):Void {	
		
		this._xscale = Math.sqrt(this._xscale * this._yscale);
		this._yscale = this._xscale;

		// apply the tint variable to this cursor.
		col = new Color(this.graphics);
		var untypedTint = tint;
		col.setRGB(untypedTint);

		super.draw();
	}
	
}