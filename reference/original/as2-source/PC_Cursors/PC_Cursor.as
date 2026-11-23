/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* 
*  PC_CURSOR
* 
* The PC_Cursor class contains all variables, 
* properties and functions that are common to all 
* cursors. Event dispatching is also handled in 
* this class. Its subclasses set certain variables, 
* such as isBall and graphics_mc to a value to make 
* specify their behaviour.
* 
****************************************************/

class PC_Cursors.PC_Cursor extends mx.core.UIObject {

	[Event("pc_force")]
	[Event("pc_forceStart")]
	[Event("pc_forceEnd")]

	function dispatchEvent( ) { };
	function addEventListener( ) { };
	function removeListener( ) { };
	

	// Vars
	//--------------------------------------
	private var __isball:Boolean;		  // is a ball or not?
	
	private var __mouselink:Boolean;      // move with mouse or not?
	
	private var __mouseasforce:Boolean;	  // Use mouse movements as forces or not (use as simple displacements)?
	
	private var __xSpeed:Number;		  // horiz. velocity, used to calculate displacement
	private var __ySpeed:Number;		  // vert. velocity, used to calculate displacement
	
	private var __xLastMouseDisp:Number;  // 
	private var __yLastMouseDisp:Number;  // 

	private var __xLastForceDisp:Number;  // 
	private var __yLastForceDisp:Number;  // 
	
	private var __cursorSound:Sound;
	private var __cursorSoundName:String;
	private var __currentObject:Object;
	
	private var __cursorgrip:Number;	  // Determines how much Speed decreases (every frame)
									      // High grip means it loses speed quickly

	private var __surfacegrip:Number;	  // Also determines how much Speed decreases
									      // Is set by object when cursor passes over it, normal = 1

	private var __inertia:Number;		  // Determines how much Speed increases (when force is applied)
									      // High inertia means it gains speed slowly  


	private var graphics_mc:MovieClip;

	
	
	// (Inspectable) Getters & Setters
	//--------------------------------------

	// Grip: Determines how much this cursor's Speed decreases (every frame)
	// High grip means it loses speed quickly
	[Inspectable(type="Number", defaultValue=50, name="Force Grip", category="Force")]
	public function set grip( newGrip:Number ):Void {
		__cursorgrip = newGrip;
	}
	public function get grip( ):Number {
		return __cursorgrip;
	}

	// Inertia: Determines how much this cursor's Speed increases (when force is applied)
	// High inertia means it gains speed slowly
	[Inspectable(type="Number", defaultValue=10, name="Force Inertia", category="Force")]
	public function set inertia( newInertia:Number ):Void {
		__inertia = newInertia;
	}
	public function get inertia( ):Number {
		return __inertia;
	}		

	
	// __isball
	public function get isBall( ):Boolean {
		return __isball;
	}
	public function set isBall( newBall:Boolean ) {
		__isball = newBall;
	}

	// __mouselink
	public function get mouseLink( ):Boolean {
		return __mouselink;
	}
	public function set mouseLink( newMouseLink:Boolean ) {
		__mouselink = newMouseLink;
	}

	// __mouseasforce
	public function get mouseAsForce( ):Boolean {
		return __mouseasforce;
	}
	public function set mouseAsForce( newMouseAsForce:Boolean ) {
		__mouseasforce = newMouseAsForce;
	}

	// __surfacegrip
	public function get surfaceGrip( ):Number {
		return __surfacegrip;
	}
	public function set surfaceGrip( newGrip:Number ) {
		__surfacegrip = newGrip;
	}

	// __x/ySpeed
	public function get xSpeed( ):Number {
		return __xSpeed;
	}
	public function set xSpeed( xs:Number ) {
		if ( !isNaN( xs ) ) {
			__xSpeed = xs;
		}
	}
	public function get ySpeed( ):Number {
		return __ySpeed;
	}
	public function set ySpeed( ys:Number ) {
		if ( !isNaN( ys ) ) {
			__ySpeed = ys;
		}
	}

	public function setSpeed( xs: Number, ys: Number ) {
		if ( !( isNaN( xs ) || isNaN( ys ) ) ) {
			__xSpeed = xs;
			__ySpeed = ys;
		}
	}

	// __x/yLastMouseDisp
	public function get xLastMouseDisp( ):Number {
		return __xLastMouseDisp;
	}
	public function set xLastMouseDisp( xlmd:Number ) {
		if ( !isNaN( xlmd ) ) {
			__xLastMouseDisp = xlmd;
		}
	}
	public function get yLastMouseDisp( ):Number {
		return __yLastMouseDisp;
	}
	public function set yLastMouseDisp( ylmd: Number ) {
		if ( !isNaN( ylmd ) ) {
			__yLastMouseDisp = ylmd;
		}
	}

	public function setLastMouseDisp( xlmd:Number, ylmd:Number ) {
		if ( !( isNaN( xlmd ) || isNaN( ylmd ) ) ) {
			__xLastMouseDisp = xlmd;
			__yLastMouseDisp = ylmd;
		}
	}
	
	// __x/yLastForceDisp
	public function get xLastForceDisp( ):Number {
		return __xLastForceDisp;
	}
	public function set xLastForceDisp( xlfd:Number ) {
		if ( !isNaN( xlfd ) ) {
			__xLastForceDisp = xlfd;
		}
	}
	public function get yLastForceDisp( ):Number {
		return __yLastForceDisp;
	}
	public function set yLastForceDisp( ylfd: Number ) {
		if ( !isNaN( ylfd ) ) {
			__yLastForceDisp = ylfd;
		}
	}

	public function setLastForceDisp( xlfd:Number, ylfd:Number ) {
		if ( !( isNaN( xlfd ) || isNaN( ylfd ))) {
			__xLastForceDisp = xlfd;
			__yLastForceDisp = ylfd;
		}
	}

	// __x/yLastDisp
	public function get xLastDisp( ):Number {
		return __xLastForceDisp + __xLastMouseDisp;
	}
	public function get yLastDisp( ):Number {
		return __yLastForceDisp + __yLastMouseDisp;
	}


	// visible
	public function set visible( b:Boolean ) {
		if ( !b ) {
			graphics_mc._alpha = 0;
		} else {
			graphics_mc._alpha = 100;
		}
	}
	public function get visible( ):Boolean {
		if ( graphics_mc._alpha == 0 ) {
			return false;
		} else {
			return true;
		}
	}

	
	// x/yPos
	public function get xPosition( ):Number {
		return graphics_mc._x;
	}
	public function set xPosition( newx:Number ) {
		if ( !isNaN( newx ) ) {
			graphics_mc._x = newx;
		}
	}
	public function get yPosition( ):Number {
		return graphics_mc._y;
	}
	public function set yPosition( newy:Number ) {
		if ( !isNaN( newy ) ) {
			graphics_mc._y = newy;
		}
	}

	public function setPosition( newx:Number, newy:Number ) {
		if ( !( isNaN( newx ) || isNaN( newy ) ) ) {
			
			position( newx, newy );
		}
	}
	
	// set CursorSound
	public function setCursorSound( newCursorSoundName:String, objSender:Object ):String {
		__currentObject = objSender;
		
		if ( newCursorSoundName != __cursorSoundName ) {			
			__cursorSoundName = newCursorSoundName;		
			
			__cursorSound = new Sound( this );	
			__cursorSound.setVolume( 0 );
			__cursorSound.stop( );			
			
			if ( __cursorSoundName != "Null" && __cursorSoundName != "" ) {
				__cursorSound.attachSound( __cursorSoundName );
				
				if ( objSender.__strength != undefined ) {
//					__cursorSound.setVolume( Math.max( 0, Math.min( 100, objSender.__strength * 10 ) ) );
					setCursorSoundVolume( objSender.__strength * 10 );
				} else {
					setCursorSoundVolume( 50 );
//					__cursorSound.setVolume( 50 );
				}
				
				__cursorSound.start( 0, 9999 );
			}
		}
		
		return __cursorSoundName;
	}
	
	public function setCursorSoundVolume( intVolume:Number ) {
		__cursorSound.setVolume( Math.max( 0, Math.min( 100, intVolume ) ) );
	}


	// Graphics MC
	public function get graphics( ):MovieClip {
		return graphics_mc;
	}

	// Constructor
	//--------------------------------------
	function PC_Cursor( ) {
	}


	// Init & Draw methods
	//--------------------------------------
	function init( Void ):Void {

		this.onLoad = function( ) {			
		
			setSpeed( 0, 0 );
			setLastForceDisp( 0, 0 );
			setLastMouseDisp( 0, 0 );
			surfaceGrip = 1;
						
			// notify the Engine we're here
			_root.PC_Engine.addCursor( targetPath( this ) )	;
		};

		super.init( );
	}
	
	
	// Custom Methods
	//--------------------------------------

	public function displace( dx:Number, dy:Number ) {
		if ( __currentObject != undefined ) {
			var numDst = Math.sqrt( Math.pow( dx, 2 ) + Math.pow( dy, 2 ) );
			var numDia = Math.sqrt( Math.pow( __currentObject._width, 2 ) + Math.pow( __currentObject._height, 2 ) );
			
			var intNewVolume = int( ( numDst / numDia ) * 1000 );
			if ( isNaN( intNewVolume ) || intNewVolume == Infinity ) intNewVolume = 0;
			
			setCursorSoundVolume( intNewVolume );
		}		
		
		graphics_mc._x += dx;
		graphics_mc._y += dy;
	}

	public function position( xpos:Number, ypos:Number ) {
		graphics_mc._x = xpos;
		graphics_mc._y = ypos;
	}	
}