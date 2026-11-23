/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Koen Hendrix
* 
*  PC_WATCHER
* 
* The PC_Watcher displays some information about a
* single cursor. It shows the cursor’s position, 
* speed (gained from forces), and by which objects 
* the cursor is currently affected. The Watcher was 
* included in the toolkit for educational and 
* debugging purposes.
* 
****************************************************/

class PC_Debug.PC_Watcher extends MovieClip {


	// Vars
	//--------------------------------------

	private var forceArrow:MovieClip;
	private var mouseArrow:MovieClip;
	
	private var __target:Number;
	private var __averaging:Number;
	private var __updateTime:Number;
	
	private var timeCounter:Number = 0;

	private var txtSpeed:TextField;
	private var txtPosition:TextField;
	private var txtForcers:TextField;

	private var xspd_array:Array = new Array;
	private var yspd_array:Array = new Array;
	private var xpos_array:Array = new Array;
	private var ypos_array:Array = new Array;
	private var xlfd_array:Array = new Array;
	private var ylfd_array:Array = new Array;
	private var xlmd_array:Array = new Array;
	private var ylmd_array:Array = new Array;

	private var xspd:Number;
	private var yspd:Number;
	private var xpos:Number;
	private var ypos:Number;
	private var xlfd:Number;
	private var ylfd:Number;
	private var xlmd:Number;
	private var ylmd:Number;	
	
	
	// Inspectables
	//--------------------------------------

	// Over how many frames the watcher’s data should be averaged.
	//   Not averaging (by setting this parameter to 1) leads to a very irregular display.
	[Inspectable(type="Number", defaultValue=7, name="Averaging (frames)")]
	public function set averaging( newAveraging:Number ):Void {
		if ( newAveraging >= 1 ) {
			__averaging = Math.round( newAveraging );
		} else {
			__averaging = 1;
		}
	}
	public function get averaging( ):Number {
		return __averaging;
	}

	// How often the watcher should redraw its data. Minimum = 1 (every frame).
	[Inspectable(type="Number", defaultValue=1, name="Update time (frames)")]
	public function set updateTime( newUpdateTime:Number ):Void {
		if ( newUpdateTime >= 1 ) {
			__updateTime = Math.round( newUpdateTime );
		} else {
			__updateTime = 1;
		}
	}
	public function get updateTime( ):Number {
		return __updateTime;
	}

	// Which cursor the watcher should study. Cursor 1 is the cursor
	//   that was added to the stage first, cursor 2 was added second, and so on.
	[Inspectable(type="Number", defaultValue=1, name="Target cursor", catergory="Cursor")]
	public function set target( newTarget:Number ):Void {
		if ( newTarget >= 1 ) {
			__target = Math.round( newTarget );
		} else {
			__target = 1;
		}
	}
	public function get target( ):Number {
		return __target;
	}


	// Constructor
	//--------------------------------------
	function PC_Watcher( )	{
		
		// the Heartbeat should be executed every frame
		this.onEnterFrame = function() {
			heartbeat();
		};


	}


	// Custom functions
	//--------------------------------------

	private function arravg( arr:Array ):Number {
		
		var returnValue:Number = 0;
		
		for( var i=0; i < arr.length; i++ ) {
			returnValue += arr[i]
		}
		
		return returnValue / __averaging;
	}


	private function numFormat( num:Number, precision:Number ):String {

		var precision:Number = ( precision = Math.abs( precision ) );
		
		var returnValue:String = "";
		
		if( precision == 0 ) {
			
			// no decimal points
			returnValue = String ( Math.round( num ) );

		} else {
		
			// make number positive
			if ( num < 0 ) {
				num = -num;
				returnValue = "-";
			}
	
			// calculate decimals, this works only for positive numbers! (because of Floor function)
			returnValue += String  ( Math.floor(num) + "." + Math.floor(num * Math.pow( 10, precision)).toString().substr(-precision) );
		}
	
		while ( returnValue.length < 5 ) {
			returnValue = " " + returnValue;
		}

		return returnValue;	
	}



	
	// The Heartbeat
	//--------------------------------------

	private function heartbeat( ) {
		
		var e:MovieClip = _root.PC_Engine;
		
		if ( e.getCursor( target - 1 ) != undefined ) {
		
			var cur:PC_Cursors.PC_Cursor = e.getCursor( target - 1 );
		
			var i = timeCounter % __averaging;
			
			xspd_array[ i ] = cur.xSpeed;
			yspd_array[ i ] = cur.ySpeed;
			xpos_array[ i ] = cur.xPosition;
			ypos_array[ i ] = cur.yPosition;
			xlfd_array[ i ] = cur.xLastForceDisp;
			ylfd_array[ i ] = cur.yLastForceDisp;
			xlmd_array[ i ] = cur.xLastMouseDisp;
			ylmd_array[ i ] = cur.yLastMouseDisp;
			
			timeCounter = timeCounter + 1;
			
			if ( timeCounter % __updateTime == 0 ) {
				
				// Calculate watcher data:
				//------------------------
				
				xspd = arravg( xspd_array );
				yspd = arravg( yspd_array );
				xpos = arravg( xpos_array );
				ypos = arravg( ypos_array );
				xlfd = arravg( xlfd_array );
				ylfd = arravg( ylfd_array );
				xlmd = arravg( xlmd_array );
				ylmd = arravg( ylmd_array );
			
				// Draw watcher data:
				//------------------------
				// Speed
				var numSpeed = Math.sqrt( Math.pow( xspd * 10, 2 ) + Math.pow( yspd * 10, 2 ) );
				var strSpeed = String( Math.round( 10 * numSpeed / 10 ) );
				if ( strSpeed.split( "." ).length < 2 ) strSpeed += ".0";
				txtSpeed.text = strSpeed + " px/sec";
	
				// Position
				var strPosition = Math.round( xpos ) + ", " + Math.round ( ypos );
				txtPosition.text = strPosition;
				
				// Force arrow
				if (ylfd>0) {
					forceArrow._rotation = 180 + Math.atan( xlfd / -ylfd ) * 180 / Math.PI;
				} else {
					forceArrow._rotation =       Math.atan (xlfd / -ylfd ) * 180 / Math.PI;
				}
				
				forceArrow._xscale = 50 * Math.sqrt(Math.sqrt( xlfd * xlfd + ylfd * ylfd ) );
				forceArrow._yscale = forceArrow._xscale;
	
				// Mouse arrow
				if (ylmd>0) {
					mouseArrow._rotation = 180 + Math.atan( xlmd / -ylmd ) * 180 / Math.PI;
				} else {
					mouseArrow._rotation =       Math.atan( xlmd / -ylmd ) * 180 / Math.PI;
				}
				
				mouseArrow._xscale = 50 * Math.sqrt( Math.sqrt( xlmd * xlmd + ylmd * ylmd) );
				mouseArrow._yscale = mouseArrow._xscale;
				
				//
				txtForcers.text = e.lastForcersText[ target - 1 ];
	
	
	
				// Purge variables
				xpos = 0; ypos = 0;
				xspd = 0; yspd = 0;
				xlfd = 0; ylfd = 0;
				xlmd = 0; ylmd = 0;
				
				timeCounter %= ( __averaging * __updateTime );	
			}	
		}
	}	
}