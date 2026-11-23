/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* 
*  PC_CURSORMAKER
* 
* The PC_CursorMaker is a modifier that can turn 
* any symbol into a cursor. The CursorMaker symbol 
* should be combined with another symbol in a new 
* compound symbol. The CursorMaker will then render 
* itself invisible and apply its displacements and 
* events on the new compound symbol.
* 
****************************************************/
class PC_Behaviours.PC_CursorMaker extends PC_Cursors.PC_Cursor {
	// notice: PC_CursorMaker is placed among the behaviours but extends 
	// a PC_Cursor (that is itself not a behaviour)
	// Private Vars
	//--------------------------------------
	private var __isball:Boolean = false;
	private var __mouselink:Boolean = true;
	// Public Vars
	//--------------------------------------
	public var graphics_mc:Object;
	// Constructor
	//--------------------------------------
	function PC_CursorMaker() {
	}
	// Init & Draw methods, req'd for Flash
	//--------------------------------------
	function init(Void):Void {
		// the graphics-symbol of this cursor is the symbol that
		//  this modifier is put into, in other words, its parent.
		graphics_mc = _parent;
		// the modifier's icon should not be visible in the movie
		this._visible = false;
		super.init();
	}

}
