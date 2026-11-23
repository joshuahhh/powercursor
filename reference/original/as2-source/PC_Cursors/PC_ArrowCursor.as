/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* 
*  PC_ARROWCURSOR
* 
* The PC_ArrowCursor is the default cursor of the 
* PowerCursor toolkit. It has the same appearance 
* as the standard Windows operating system cursor, 
* except that it is coloured red by default.
* 
****************************************************/
class PC_Cursors.PC_ArrowCursor extends PC_Cursors.PC_Cursor {
	// Vars
	//--------------------------------------
	private var graphics:MovieClip;
	private var __isball:Boolean = false;
	private var __mouselink:Boolean = true;
	[Inspectable(type="Boolean", defaultValue=false, name="Mouse as Force", category="Force")]
	private var __mouseasforce:Boolean = false;
	private var __tint:Color;
	private var col:Color;
	private var __cursorStyle:String;
	private var __cursorStyleDefault:String;
	// Graphics: These vars set the object's graphical properties.
	/*	[Inspectable(type="Color", defaultValue="#DD2424", name="Graphics Tint", category="Graphics")]
	public function set tint(newTint:Color):Void {
	__tint = newTint;
	draw();	
	}
	public function get tint():Color {
	return __tint;
	}
	*/
	// Different graphic styles of the cursor. 
	[Inspectable(type="String", enumeration="Arrow,Finger,Ball,GrabHand", defaultValue="Arrow", name="CursorStyle", category="Force")]
	 public function set cursorStyle(newCursorStyle:String):Void {
		__cursorStyle = newCursorStyle;
		__cursorStyleDefault = __cursorStyle;
		 
	}
	public function get cursorStyle():String {
		return __cursorStyle;
	}
	// Getters & Setters
	public function setCursorStyle(newCursorStyle:String):String {
		 if (newCursorStyle<>__cursorStyle) {
			__cursorStyle = newCursorStyle;
			if (newCursorStyle == "Default") {
				__cursorStyle = __cursorStyleDefault;
			}
			draw();
		}
		return __cursorStyle;
	}
	// Constructor
	//--------------------------------------
	function PC_ArrowCursor() {
	}
	// Init & Draw methods
	//--------------------------------------
	function init(Void):Void {
		// the graphics-symbol of this cursor is this class' own symobol
		graphics_mc = this;
		super.init();
	}
	function draw(Void):Void {
		// apply the tint variable to this cursor.
		/*col = new Color(this.graphics);
		var untypedTint = tint;
		col.setRGB(untypedTint);
		*/
		graphics_mc.gotoAndStop(__cursorStyle);
		super.draw();
	}
}
