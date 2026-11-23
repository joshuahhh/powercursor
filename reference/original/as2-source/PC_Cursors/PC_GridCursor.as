/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, April 2007, by Mensvoort/de Man
* 
*  PC_GRIDCURSOR
* 
* This cursor is used to calculate the displacement 
* of the gridpoints of the PowerGrid
* 
****************************************************/

class PC_Cursors.PC_GridCursor extends PC_Cursors.PC_Cursor {


	// Vars
	//--------------------------------------
	private var __mouselink:Boolean = false;
	private var __mouseasforce:Boolean = true;


	// Constructor
	//--------------------------------------
	function PC_GridCursor( ) {
		
	}	

	// Init & Draw methods
	//--------------------------------------
	function init( Void ):Void {
		// the graphics-symbol of this cursor is this class' own symobol
		graphics_mc = this;	
			
		super.init( );
	}

	function draw( Void ):Void {	
		super.draw( );
	}
	
	// Custom function
	// -----------------------------------
	public function displace( dx:Number, dy:Number ) {
		if ( dx < 0 ) dx = Math.max( -_parent.__cellsize / 2, dx * 10 );
		else dx = Math.min( _parent.__cellsize / 2, dx * 10 );
		
		if ( dy < 0 ) dy = Math.max( -_parent.__cellsize / 2, dy * 10 );
		else dy = Math.min( _parent.__cellsize / 2, dy * 10 );

		graphics_mc._x += dx;
		graphics_mc._y += dy;
		
		// Reset 'fake' cursor props
		this.setSpeed( 0, 0 );	
		this.setLastMouseDisp( 0, 0 );		
		this.setLastForceDisp( 0, 0 );
		
		_parent.update( );
	}		
	
	// set CursorSound
	// ( empty function to override playing rolloversounds )
	public function setCursorSound( ) {
	}
}