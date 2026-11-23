/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2007, by Mensvoort/de Man
* 
*  PC_Target
* 
* The PC_Target is an circular object that pulls cursors towards its centre. 
* When the center is reached, the forces are disabled. 
* 
****************************************************/

class PC_Objects.PC_Target extends PC_Objects.PC_RoundReadyMadeObject {
	
	// Vars
	//--------------------------------------	
	private var __targetlistener:Object;
	private var __initStrength:Number;
	private var __showbullseye:Boolean;
	
	private var bullseye:MovieClip;
	
	// Inspectables
	//--------------------------------------

	// Tint is the colour of the object’s circle or disc.
	[Inspectable(type="Color", defaultValue="#DD2424", name="Graphics Tint", category="Graphics")]
	public function set tint( newTint:Color ):Void {
		__tint = newTint;
		
		draw( );
	}
	public function get tint( ):Color {
		return __tint;
	}
	
	// Graphics: These vars set the object's graphical properties.
	[Inspectable(type="Boolean", defaultValue="true", name="Show Bullseye", category="Graphics")]
	public function set showBullseye( newStatus:Boolean ):Void {
		__showbullseye = newStatus;
		
		draw( );
	}
	public function get showBullseye( ):Boolean {
		return __showbullseye;
	}


	// Constructor
	//--------------------------------------
	function PC_Target( )	{
		
		this.createListener( );
	}


	// Init & Draw methods
	//--------------------------------------
	function init( Void ):Void {		
		__initStrength = __strength;
		
		super.init( );
	}

	function draw( Void ):Void {
		
		if ( __showbullseye ) {
			bullseye._alpha = 100;
		} else {			
			bullseye._alpha = 0;
		}
		
		super.draw( );

		// the Target should like the hill, except with shading rotated 180º.
		this.shadingshade._rotation -= 180;
		this.shadingshade._x += 100;
		this.shadingshade._y += 100;
		
		this.shadinglight._rotation -= 180;
		this.shadinglight._x += 100;
		this.shadinglight._y += 100;
		
		bullseye.swapDepths( this.getNextHighestDepth( ) );
		shadingshade.swapDepths( this.getNextHighestDepth( ) );
		shadinglight.swapDepths( this.getNextHighestDepth( ) );
	}
		

	// Custom Methods
	//--------------------------------------
	
	// This function (called by PC_ObjectHeart) exerts force on a cursor
	function applyForce( i:Number, relx:Number, rely:Number, globalx:Number, globaly:Number ):Void {
		
		var e:MovieClip = _root.PC_Engine;

		// Center relative coordinates on hilltop
		relx -= 50;
		rely -= 50;

		// Calculate at what angle (from the center) the cursor is
		var angle:Number;
		angle = Math.atan( relx / -rely );
		angle = ( angle / ( 2 * Math.PI ) ) * 360;
		if ( rely > 0 ) angle += 180;


		if ( Math.sqrt( ( relx * relx ) + ( rely * rely ) ) > ( __plateau / 2 ) ) {

			if ( shape == "V-shaped" ) {
				// if V-shaped, slope is put to 4 or -4 (constant slope)
				var slope = 4;
			} else {
				if( shape == "U-shaped" ) {
					// if U-shaped, distance from center is used for slope (round slope)
					var slope = 0.12 * Math.sqrt( ( relx * relx ) + ( rely * rely ) );
				} else {
					// if Sine-shaped, slope is like half sine function
					var slope = 5 * Math.sin( Math.sqrt( ( relx * relx ) + ( rely * rely ) ) * Math.PI / 51 );
				}
			}
			
			// Apply the force, with the right strength in the right direction
			e.addForce( i,
				-__strength * ( slope / 10 ) * Math.sin( ( ( angle ) * 2 * Math.PI ) / 360 ),
				 __strength * ( slope / 10 ) * Math.cos( ( ( angle ) * 2 * Math.PI ) / 360 ),
			targetpath( eventTarget ) )
			
		} else  {

			e.dispatchPCEvent( i, eventTarget, "pc_plateau" );		 
			
			// only hide target when not hit by gridCursor
			if ( _root.PC_Engine.getCursor( i )._parent == _root ) {
				this.visualisation._visible = false;
				this.shadingshade._visible = false;
				this.shadinglight._visible = false;
				this.bullseye._visible = false;
				
				__strength = 0;
				
	
				// Apply an empty force
				e.addForce( i, 0, 0, targetpath( eventTarget ) )			
			}
		}
	}
	
	private function createListener( ) {
		var __targetobject = this;
		
		__targetlistener = new Object( );	
		__targetlistener.pc_rollin = function( eventObj:Object ) {		
			__targetobject.__strength = __targetobject.__initStrength;
		};	

		__targetlistener.pc_rollout = function( eventObj:Object ) {
			
			__targetobject.visualisation._visible = true;
			__targetobject.shadingshade._visible = true;
			__targetobject.shadinglight._visible = true;
			__targetobject.bullseye._visible = true;
			
			__targetobject.__strength =__targetobject. __initStrength;
		};
		
		this.addEventListener( "pc_rollin", __targetlistener );
		this.addEventListener( "pc_rollout", __targetlistener );
	}
}