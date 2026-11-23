/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* V1.1, August 2007, by Mensvoort/de Man
* 
*  PC_ENGINE
* 
* The PC_Engine care of general tasks that concern 
* more than one component, such as frame rate 
* handling, bouncing balls, and system cursor 
* tracking. More importantly, it computes cursor 
* displacements by combining cursor properties, 
* objects’ forces, and mouse movements.
*
****************************************************/

import mx.managers.SystemManager;


class PC_System.PC_Engine extends MovieClip {


	// Vars
	//--------------------------------------
	private var oldXMouse:Number;	// to keep track of 
	private var oldYMouse:Number;	//     mouse movements

	private var MouseLoc:String = "Onstage"; // Onstage, Leaving, Offstage, Entering
	
	private var startTime:Number;
	private var oldTime:Number;
	private var frameTime:Number;

	private var __baseForce:Number;
	private var __hideAllObjects:Boolean;
	private var __scaleToAlpha:Boolean;
	private var __combineForces:String;
	private var __hideRealCursor:Boolean;	
	private var __bouncingBalls:Boolean;
	
	private var __speedLimit:String;
	private var __speedHistory:Array = new Array( );
	private var __speedHistoryLength:Number = 5;
	private var __speedPresets:Object = { lowspeed: 5,
										  averagespeed: 25,
										  highspeed: 50 };
		
	// The array of cursors. This contains all information about
	// all cursors controlled by the Engine.
	private var cursors:Array = new Array( ); // of Strings (paths)

	private var walls:Array = new Array( ); // of Strings (paths)
	
	private var forces:Array = new Array( ); // of arrays
	private var dimmers:Array = new Array( ); // of arrays

	private var forced:Array = new Array( ); // of Booleans
	private var forcedLastFrame:Array = new Array( ); // of Booleans

	private var lastForcersText:Array = new Array( ); // of Booleans

		

	// Inspectables
	//--------------------------------------

	// A base force scaling parameter. Setting this above or below 100 will scale all forces appropriately.
	[Inspectable(type="Number", defaultValue=100, name="Base Force", category="Force", verbose=0)]
	public function set baseForce( newBaseForce:Number ):Void {
		__baseForce = newBaseForce;
	}
	public function get baseForce( ):Number {
		return __baseForce;
	}

	// .
	[Inspectable(type="Boolean", defaultValue=false, name="Hide all objects", category="Graphics")]
	public function set hideAllObjects( newHideAllObjects:Boolean ):Void {
		__hideAllObjects = newHideAllObjects;
	}
	public function get hideAllObjects( ):Boolean {
		return __hideAllObjects;
	}

	// Enabling Scale-to-alpha multiplies all forces by their object’s alpha transparency (0 - 1).
	[Inspectable(type="Boolean", defaultValue=true, name="Scale force to _alpha", category="Force")]
	public function set scaleToAlpha( newScaleToAlpha:Boolean ):Void {
		__scaleToAlpha = newScaleToAlpha;
	}
	public function get scaleToAlpha( ):Boolean {
		return __scaleToAlpha;
	}

	// How the engine combines several forces on a single cursor: By using only the strongest, using only the topmost, or by adding the forces together.
	[Inspectable(type="String", enumeration="Add,Strongest,Topmost", defaultValue="Add", name="Combine Forces", category="Force")]
		public function set combineForces( newCombineForces:String ):Void {
		__combineForces = newCombineForces;
	}
	public function get combineForces( ):String {
		return __combineForces;
	}

	// How the engine dims the speed of the powercursor when moving fast.
	[Inspectable(type="String", enumeration="low speed,average speed,high speed,never", defaultValue="high speed",name="Ignore forces at", category="Force")]
	public function set speedLimit( newSpeedLimit:String ):Void {
		__speedLimit = newSpeedLimit;
	}
	public function get speedLimit( ):String {
		return __speedLimit;
	}


	// Whether the system cursor should be hidden when it is within (above) the Flash movie.
	[Inspectable(type="Boolean", defaultValue=true, name="Hide Real Cursor", category="Cursor")]
	public function set hideRealCursor( newHideRealCursor:Boolean ):Void {
		__hideRealCursor = newHideRealCursor;
	}
	public function get hideRealCursor( ):Boolean {
		return __hideRealCursor;
	}


	// Whether balls should bounce off each other or simply pass through each other like other cursors.
	[Inspectable(type="Boolean", defaultValue=true, name="Bouncing balls", category="Balls")]
	public function set bouncingBalls( newBouncingBalls:Boolean ):Void {
		__bouncingBalls = newBouncingBalls;
	}
	public function get bouncingBalls( ):Boolean {
		return __bouncingBalls;
	}


	// Constructor
	//--------------------------------------
 
	function PC_Engine( )	{
		
		 // check if Engine is in root.
		if ( _root == this._parent ) {
			
			// if so, rename self so other AC components can find the Engine.
			this._name = "PC_Engine"
			
			//Stage.scaleMode = "noScale";
			Stage.align = "TL"; // align stage top left (needed to sync the system cursor with powercusor)		
		} else { 
			trace ( "This Powercursor engine object (" + this + ") is not placed at root level and therefore disabled and made invisible" );
			this._visible = false;
		}
		
		// the Heartbeat should be executed every frame
		this.onEnterFrame = function( ) {
			
			// but only if engine is in root. 
			if ( _root == this._parent ) heartbeat( );
		};

		// get an initial time to calculate framerate
		var myDate = new Date;
		oldTime = myDate.getMilliseconds() + 1000*myDate.getSeconds();
		

		var myMenu:ContextMenu = new ContextMenu();
		var mySiteLink:ContextMenuItem = new ContextMenuItem("Powered by PowerCursor.com",gotoPowerCursor);
	    myMenu.customItems.push(mySiteLink);
	   _root.menu = myMenu;
	}
	

	// Getters & Setters
	//--------------------------------------

	public function setCursorStyle( g: String, i: Number ) {
		//trace ("getcursor:"+getCursor(0)+" path:"+getCursor(i));
		 getCursor( i ).setCursorStyle( g );
		 //mypath.setGraphicStyle(g);
		//PC_Cursors.PC_Cursor.setGraphicStyle(g);
	}
	
	public function setCursorSound( g: String, i: Number ) {
		getCursor( i ).setCursorSound( g );
	}

	public function getCursor( i: Number ):MovieClip {
		return eval( String( cursors[ i ] ) );
	}

	public function getCursorPath( i: Number ):String {
		return cursors[ i ];
	}
	
	public function getCursorCount( ):Number {
		return cursors.length;
	}

	public function displaceCursor( i: Number, xd: Number, yd: Number ) {
		if ( !( isNaN( xd ) || isNaN( yd ) ) ) {
			getCursor( i ).displace( xd, yd );			
		} else if ( getCursor( i )._parent != _root ) {
			getCursor( i ).displace( 0, 0 );			
		}
	}
	
	
	// API-controls
	// 
	//--------------------------------------
	
	/* 
	* Engine-params that can be get and / or set runtime.
	*/	
	
	public function getSpeedLimit( Void ):String {
		return __speedLimit;
	}
	
	public function setSpeedLimit( newSpeedLimit ):Boolean {
		
		var arrSpeedLimits:Array = [ "never", "low speed", "average speed", "high speed" ];
		
		for ( var i=0; i<arrSpeedLimits.length; i++ ) {
			
			switch( typeof( newSpeedLimit ) ) {
				
				case "string":
					var strSpeedLimit:String = newSpeedLimit.toLowerCase( );
					
					if ( strSpeedLimit == arrSpeedLimits[ i ] ) {
						__speedLimit = strSpeedLimit;
						
						return true;
					}
					
					break;
					
				case "number":
					var intSpeedLimit:Number = newSpeedLimit;
					
					if ( intSpeedLimit == i ) {
						__speedLimit = arrSpeedLimits[ i ];
						
						return true;
					}
				
					break;
			}
		}
		
		return false;
	}
	
	
	public function hideRealMouseCursor( Void ):Void {
		__hideRealCursor = true;
		
		Mouse.hide( );
	}
	
	public function showRealMouseCursor( Void ):Void {
		__hideRealCursor = false;
		
		Mouse.show( );
	}
	
	
	public function scaleForceToAlpha( newScaleToAlpha ):Boolean {
		if ( typeof( newScaleToAlpha ) != "boolean" ) __scaleToAlpha = newScaleToAlpha;

		return __scaleToAlpha;
	}
	
	
	public function getBaseForce( Void ):Number {
		return __baseForce;
	}
	
	public function setBaseForce( newBaseForce:Number ):Void {
		__baseForce = newBaseForce;
	}
	
	
	public function getForceBlend( Void ):String {
		return __combineForces;
	}
	
	public function setForceBlend( newBlend ):Boolean {
		
		var arrBlends:Array = [ "add", "strongest", "topmost" ];
		
		for ( var i=0; i<arrBlends.length; i++ ) {
			
			switch( typeof( newBlend ) ) {
				
				case "string":
					var strBlend:String = newBlend.toLowerCase( );
					
					if ( strBlend == arrBlends[ i ] ) {
						__combineForces = strBlend;
						
						return true;
					}
					
					break;
					
				case "number":
					var intBlend:Number = newBlend;
					
					if ( intBlend == i ) {
						__combineForces = arrBlends[ i ];
						
						return true;
					}
				
					break;
			}
		}
		
		return false;
	}
	
	
	public function useBouncingBalls( newSetting ):Boolean {
		if ( typeof( newSetting ) != "boolean" ) __bouncingBalls = newSetting;
		
		return __bouncingBalls;
	}
	
	
	public function getCursorList( Void ):Array {
		return cursors;
	}
	
	public function getWalls( Void ):Array {
		return walls;
	}
	
	public function getForces( Void ):Array {
		return forces;
	}
	
	public function getDimmers( Void ):Array {
		return dimmers;
	}


	// Custom functions
	//--------------------------------------
	
	/* 
	* All cursors call the addCursor() function once to attach themselves
	* to the Engine. That's all the cursors ever do, the rest is handled
	* by the Engine and EngineHeart.
	*/
	
	
	public function addCursor( path:String ) {
		
		// Add the new Cursor to the array.
		cursors.push( path );
		
		var i = cursors.length - 1;
		
		forces[ i ] = new Array( );
		dimmers[ i ] = new Array( );
				
		forced[ i ] = false;
		forcedLastFrame[ i ] = false;
		
		if ( __hideRealCursor ) Mouse.hide( );
	}
	

	public function addWall( path:String ) {

		// Add the new wall to the array.
		walls.push( path );
	}


	/* 
	* Objects call the addForce() function when they want to exercise a
	* force onto the cursor. Non-physical cursors are simply displaced,
	* for physical cursors the speed is altered (the actual cursor
	* movement will be done every frame by EngineHeart).
	*/
	public function addForce( i:Number, xForce:Number, yForce:Number, sender:String ) {

		var ff = baseForce / 100;
	
		var cur = getCursor( i );
		
		if ( __scaleToAlpha ) {
		
			var senderAlpha = getProperty( eval( sender ), _alpha) / 100;
			xForce *= senderAlpha;
			yForce *= senderAlpha;
		}

		var f:PC_System.PC_ForceRecord = new PC_System.PC_ForceRecord(
			( 5 * xForce * ff ) / cur.inertia,
			( 5 * yForce * ff ) / cur.inertia,
			sender
		);
		
		addCursorForce( i, f );

		forced[ i ] = true;
			
	}

	public function addDimmer( i:Number, dimming:Number, scope: Boolean, sender:String ) {
		
		if ( dimming >= 0 && dimming <= 100 ) {
			
			var cur = getCursor( i );
			
			if ( __scaleToAlpha ) {
			
				var senderAlpha = getProperty( eval( sender ), _alpha ) / 100;
				dimming *= senderAlpha;
			}

			var d:PC_System.PC_DimmerRecord = new PC_System.PC_DimmerRecord( dimming, scope, sender );
			
			addCursorDimmer( i, d );

		}			

	}

	public function addCursorForce( i:Number, force:PC_System.PC_ForceRecord ) {
		forces[ i ].push( force );
	}
	
	public function addCursorDimmer( i:Number, dimmer:PC_System.PC_DimmerRecord ) {
		dimmers[ i ].push( dimmer );
	}
	
	
	// Event Dispatching
	//--------------------------------------
	
	// This function is called by object (notably the PC_Object class)
	// to create events. The objects themselves dispatch these events,
	// not the Engine.
	
	public function dispatchPCEvent( i:Number, target_mc:MovieClip, type_str:String ) {
		
		var cur:PC_Cursors.PC_Cursor = _root.PC_Engine.getCursor( i );		
		var eventObject:Object = new Object( );
		
		eventObject.target = target_mc;
		eventObject.type = type_str;
		eventObject.cursorIndex =i;
		eventObject.path = getCursorPath( i );
		eventObject.x = cur.xPosition;
		eventObject.y = cur.yPosition;
		eventObject.xLastDisp = cur.xLastDisp;
		eventObject.yLastDisp = cur.yLastDisp;

		if ( cur._parent == _root ) target_mc.dispatchEvent( eventObject );		
	}

	// The powercursor url
	//--------------------------------------

 	function gotoPowerCursor( ) { 
		_root.getURL( "http://www.powercursor.com", "_top" );		
	}

	// The Heartbeat
	//--------------------------------------

	function heartbeat( ) {
		
		var myDate = new Date;
		frameTime = myDate.getMilliseconds( ) + 1000 * myDate.getSeconds( ) - oldTime;
		
		if ( frameTime < 0 ) frameTime += 60000;
		
		oldTime = myDate.getMilliseconds( ) + 1000 * myDate.getSeconds( );
		
		// record the mouse movement using the previous frame's mouse position
		var MouseMovX = _root._xmouse - oldXMouse;
		var MouseMovY = _root._ymouse - oldYMouse;
		
		// calculate a prediction where the mouse will be next frame		
		var PredMouseX = _root._xmouse + MouseMovX;
		var PredMouseY = _root._ymouse + MouseMovY;
		
		
		// store movement of the real mousecursor
		if ( isNaN( MouseMovX ) || isNaN( MouseMovY ) ) var numDst = 0;
		else var numCurrentDst = Math.sqrt( Math.pow( MouseMovX, 2 ) + Math.pow( MouseMovY, 2 ) );

		// store current movement in __speedHistory
		if ( __speedHistory.length >= __speedHistoryLength ) __speedHistory.shift ( );
		__speedHistory.push( numCurrentDst );
				
		// calculate average speed
		var numDst = 0;
		for ( var i=0; i<__speedHistory.length; i++ ) numDst += __speedHistory[ i ];
		numDst /= __speedHistory.length;
		
		
		var MouseDispX = 0;
		var MouseDispY = 0;

		//
		// Update MouseLoc (system cursor's location)
		//
		switch ( MouseLoc ) {

			case "Leaving":
	
				MouseLoc = "Offstage";
				Mouse.show( );
	
				for ( var i=0; i < getCursorCount(); i++ ) {
					if ( getCursor( i ).mouseLink ) {
						getCursor( i ).setCursorSound( "Null", this );
					}
				}
				
				break;
				
			case "Offstage":
				
				if ( MouseMovX != 0 || MouseMovY != 0 ) {
					// If the cursor is moving, mouse is coming back on stage
					MouseLoc = "Entering";
	
					for ( var i=0; i < getCursorCount(); i++ ) {
						if ( getCursor( i ).mouseLink ) {
							getCursor( i ).setPosition( _root._xmouse,_root._ymouse );
							
							getCursor( i ).setCursorSound( "Null", this );
							getCursor( i ).visible = true;
						}
					}
				}
				
				break;
	
			
			case "Entering":
	
				MouseLoc = "Onstage";
				if ( __hideRealCursor ) Mouse.hide( );
				
				break;
	
	
			case "Onstage":
				
				// If the (predicted) mouse will be outside the stage or on
				//  the last pixel of the stage, assume the mouse is Leaving the stage.
				
				var screenx = SystemManager.screen.x;
				var screeny = SystemManager.screen.y;
				var screenwidth = SystemManager.screen.width;
				var screenheight = SystemManager.screen.height;
				
				if ( !( isNaN( screenx ) || isNaN( screeny ) ) ) {
				
					if ( PredMouseX <= screenx + 1 || PredMouseY <= screeny + 1
							|| PredMouseX >= screenwidth  + screenx - 1
							|| PredMouseY >= screenheight + screeny - 1 ) {
										
						MouseLoc = "Leaving";
						for ( var i=0; i<getCursorCount( ); i++ ) {
							if ( getCursor( i ).mouseLink ) {
								getCursor( i ).visible = false;
							}
						}
					}
				}
				
				break;
				
			default:
				MouseLoc = "Onstage";
				
				break;		
		}


		//
		// Loop through all balls for bouncies
		//
		
		if ( __bouncingBalls ) {
		
			var b1, b2:MovieClip;
			
			var dx, dy, dist, r:Number;
			var mass1, mass2 :Number;
			var b1p, b1px, b1py:Number;
			var b2p, b2px, b2py:Number;
			var b1k, b1kx, b1ky:Number;
			var b2k, b2kx, b2ky:Number;
			
			
			var hardness:Number = 0.9; // hardness?  0-1
										// 1 = full elastic collision
	
			for ( var i=0; i < getCursorCount(); i++ ) {
	
				b1 = getCursor( i );
				
				if ( b1.isBall ) {
	
					for ( var j=i+1; j < getCursorCount( ); j++ ) {
						
						b2 = getCursor( j );
						
						if ( b2.isBall ) {
	
							// mass is calculated 2-dimensionally:
							// balls that are twice as high and twice as
							// wide are considered four times as heavy,
							// not eight times.
							mass1 = Math.pow( b1.xScale / 100, 2 );
							mass2 = Math.pow( b2.xScale / 100, 2 );

							if ( ( b1.xPosition - b2.xPosition == 0 ) && 
								 ( b1.yPosition - b2.yPosition == 0 ) ) {

									
								b1.displace( 10, 10 );
								
							}
							
							dx = b1.xPosition - b2.xPosition;
							dy = b1.yPosition - b2.yPosition;
							
							dist = Math.sqrt( ( dx * dx ) + ( dy * dy ) );
							
							
							if ( ( b1._xscale + b2._xscale ) / dist > 10 ) {
	

								while ( ( b1._xscale + b2._xscale ) / dist > 10 ) {
									b1.xPosition += dx / 100;
									b2.xPosition -= dx / 100;
									b1.yPosition += dy / 100;
									b2.yPosition -= dy / 100;
	
									dx = b1.xPosition - b2.xPosition;
									dy = b1.yPosition - b2.yPosition;
									dist = Math.sqrt( ( dx * dx ) + ( dy * dy ) );
								}
	
								b1p = ( ( b1.xSpeed * dx ) + ( b1.ySpeed * dy) ) / dist;
								b1px = b1p * ( dx / dist );
								b1py = b1p * ( dy / dist );
	
								b2p = ( ( b2.xSpeed * dx )+( b2.ySpeed * dy ) ) / dist;
								b2px = b2p * ( dx / dist );
								b2py = b2p * ( dy / dist );
	
								b1k = ( ( b1.xSpeed * -dy ) + ( b1.ySpeed * dx ) ) / dist;
								b1kx = b1k * (-dy/dist);
								b1ky = b1k * ( dx/dist);
	
								b2k = ( ( b2.xSpeed * -dy ) + ( b2.ySpeed * dx ) ) / dist;
								b2kx = b2k * ( -dy / dist );
								b2ky = b2k * (  dx / dist );
								
								b1.xSpeed = b1kx + hardness * ( ( ( mass1 - mass2 ) / ( mass1 + mass2 ) ) * b1px + ( ( mass2 + mass2 ) / ( mass1 + mass2 ) ) * b2px );
								b2.xSpeed = b2kx + hardness * ( ( ( mass2 - mass1 ) / ( mass2 + mass1 ) ) * b2px + ( ( mass1 + mass1 ) / ( mass2 + mass1 ) ) * b1px );
								b1.ySpeed = b1ky + hardness * ( ( ( mass1 - mass2 ) / ( mass1 + mass2 ) ) * b1py + ( ( mass2 + mass2 ) / ( mass1 + mass2 ) ) * b2py );
								b2.ySpeed = b2ky + hardness * ( ( ( mass2 - mass1 ) / ( mass2 + mass1 ) ) * b2py + ( ( mass1 + mass1 ) / ( mass2 + mass1 ) ) * b1py );
	
							}
						}
					}
				}
			}
		}


		//
		// Loop through all cursors for cursor events & displacements
		//
		
		for ( var i=0; i<getCursorCount( ); i++ ) {

			var cur:MovieClip = getCursor( i );

			if ( MouseLoc == "Offstage" ) {

				cur.setSpeed( 0, 0 );
				forces[ i ].length = 0;
				dimmers[ i ].length = 0;
			}
			
			if ( MouseLoc == "Onstage" ) {

				//
				// Handle cursor events
				//

				if ( forced[ i ] ) {
		
					if ( !forcedLastFrame[ i ] ) {						
						dispatchPCEvent( i, cur, "pc_forceStart" )
					}
					
					dispatchPCEvent( i, cur, "pc_force" )
					forcedLastFrame[ i ] = true;
					
				} else {
					
					if ( forcedLastFrame[ i ] ) {
		
						dispatchPCEvent( i, cur, "pc_forceEnd" )
					}	
					forcedLastFrame[ i ] = false;
				}
				
				forced[ i ] = false;




				//
				// Handle movement
				//
				
				var dX:Number = 0;
				var dY:Number = 0;
				
				var timeFactor:Number = frameTime / 50;
				
				// if the cursor is linked to the mouse, exert a
				//  force based on the direction the mouse moved,
				//  possibly dimmed by mousedimmers
				
				if ( cur.mouseLink ) {
					
					var mdim = 1;
					
					for ( var d=0; d<dimmers[i].length; d++ ) {

						if ( dimmers[ i ][ d ].scope == "Mouse" ) {
							mdim *= dimmers[ i ][ d ].dimming / 100;
						}
					}
					
					if ( cur.mouseAsForce ) {
						
						var ff = 100 / __baseForce;
						addForce( i, MouseMovX * ff * mdim, MouseMovY * ff * mdim, targetPath( this ) );
						
					} else {
						
						dX += MouseMovX*mdim / cur.surfaceGrip;
						dY += MouseMovY*mdim / cur.surfaceGrip;
						
						cur.setLastMouseDisp(MouseMovX / cur.surfaceGrip, MouseMovY / cur.surfaceGrip)
						
					}
				}
				




				//name of sender:
				//trace(sender.substr(sender.lastIndexOf(".") + 1));
				
				//parent of sender:
				//trace(sender.substr(0, sender.lastIndexOf(".")));

				var fparent, dparent: String;
				var fx:Array = new Array();
				var fy:Array = new Array();

				var forcersText: String = "";
				
				for ( var f=0; f < forces[i].length; f++ ) {
					
					fparent = forces[ i ][ f ].sender.substr( 0, forces[ i ][ f ].sender.lastIndexOf( "." ) );
					
					// Put the forces in temporary array(s)
					//
					fx[ f ] = forces[ i ][ f ].x;
					fy[ f ] = forces[ i ][ f ].y;
					
					
					// Check wether the dimmers apply to this force,
					//  if so, apply their dimming
					//
					for ( var d=0; d<dimmers[ i ].length; d++ ) {

						dparent = dimmers[ i ][ d ].sender.substr( 0, dimmers[ i ][ d ].sender.lastIndexOf( "." ) );
						
						if ( dimmers[ i ][ d ].scope == "Global" || ( dimmers[ i ][ d ].scope == "Local" && fparent == dparent ) ) {
							
							fx[ f ] *= dimmers[ i ][ d ].dimming / 100;
							fy[ f ] *= dimmers[ i ][ d ].dimming / 100;
						}
					}
					
//					cur.xSpeed += fx * timeFactor;
//					cur.ySpeed += fy * timeFactor;
				}

				// Combine the forces in fx/fy in an appropriate
				//  manner, default is just adding them

				var dxSpeed = 0; 
				var dySpeed = 0;
				
				// If the cursor uses mouse movements as forces,
				// add that force to the speed now and remove it from the array,
				// because we don't want to use it in the force-combining algorithm.
				
				if ( cur.mouseAsForce ) {
					dxSpeed += fx[ fx.length - 1 ];
					dySpeed += fy[ fy.length - 1 ];
					fx.length -= 1;
					fy.length -= 1;					
				}


				if ( fx.length > 0 ) {
				
					switch ( __combineForces ) {
							
						case "Strongest":
						
							var m:Number = 0;
							var max:Number; 
							
							max = Math.sqrt( ( fx[ 0 ] * fx[ 0 ] ) + ( fy[ 0 ] * fy[ 0 ] ) )
							
							for ( var f=1; f<fx.length; f++ ) {
								
								var fstr = Math.sqrt( ( fx[ f ] * fx[ f ] ) + ( fy[ f ] * fy[ f ] ) );
								if ( fstr > max ) {
									m = f;
									max = fstr;
								}
							};
							
							dxSpeed += fx[ m ];
							dySpeed += fy[ m ];

							for ( var f=0; f < fx.length; f++ ) {
								if ( f != 0 ) { forcersText += ", " };
								if ( f != m ) { forcersText += "(" };
								forcersText += eval( String( forces[ i ][ f ].sender ) )._name;
								if ( f != m ) { forcersText += ")" };
							};
							
							break;
							
	
						case "Topmost":
						
							var senders:Array;
							senders = new Array( );
							for ( var f=0; f<forces[ i ].length; f++ ) {
								senders[ f ] = forces[ i ][ f ].sender;
							}
							
							var top:Number = findTopmost( senders );
							dxSpeed += fx[ top ];
							dySpeed += fy[ top ];
							
							for ( var f=0; f<fx.length; f++ ) {
								if ( f != 0 ) { forcersText += ", " };
								if ( f != top ) { forcersText += "(" };
								forcersText += eval( String( forces[ i ][ f ].sender ) )._name;
								if ( f != top ) { forcersText += ")" };
							};

							break;

						case "Add":
					
			//				break; // This break was accidentially put here by Pascal and shouldn't be here?
							
						default:

							for ( var f=0; f<fx.length; f++ ) {
								dxSpeed += fx[ f ];
								dySpeed += fy[ f ];

								if ( f != 0 ) { forcersText += ", " };
								forcersText += eval( String( forces[ i ][ f ].sender ) )._name;
							};

							break;
					}
				}


				cur.xSpeed += dxSpeed;
				cur.ySpeed += dySpeed;

				dX += cur.xSpeed * timeFactor;
				dY += cur.ySpeed * timeFactor;

//				trace( i + ": " + Math.round( cur._x ) + ", " + Math.round( cur._y ) + " => "
//								+ Math.round( cur._x + dX ) + ", " + Math.round( cur._y + dY ) );

				cur.setLastForceDisp( cur.xSpeed * timeFactor, cur.ySpeed * timeFactor );

				lastForcersText[ i ] = forcersText;

				// Change the cursor's position
				var disableDisplacement:Boolean = false;
				var onWall:Boolean = true;
				var step:Number = 11;
				var ang:Number = 0;
				var tdX, tdY: Number;
				var cursorX, cursorY: Number;

				cursorX = cur.xPosition;
				cursorY = cur.yPosition;


				while ( onWall && step >= 0 ) {

					step--;

					onWall = false;

					ang = ( ( 10 - step ) / 10 ) * Math.PI / 2;
					tdX = Math.cos( ang ) * ( dX * Math.sqrt( step / 10 ) ) + Math.sin( ang ) * ( dY * Math.sqrt( step / 10 ) );
					tdY = Math.cos( ang ) * ( dY * Math.sqrt( step / 10 ) ) - Math.sin( ang ) * ( dX * Math.sqrt( step / 10 ) );

					for ( var w=0; w<walls.length; w++ ) {

						if ( eval( String( walls[ w ] ) ).hitTest( cursorX + tdX, cursorY + tdY, true ) ) {

							onWall = true;
							continue;
						}
					}
					
					if ( onWall ) {
						onWall = false;
						disableDisplacement = true;

						ang = -ang;
						tdX = Math.cos( ang ) * ( dX * Math.sqrt( step / 10 ) ) + Math.sin( ang ) * ( dY * Math.sqrt( step / 10 ) );
						tdY = Math.cos( ang ) * ( dY * Math.sqrt( step / 10 ) ) - Math.sin( ang ) * ( dX * Math.sqrt( step / 10 ) );
						
						for ( var w=0; w<walls.length; w++ ) {		
						
							if ( eval( String( walls[ w ] ) ).hitTest( cursorX + tdX, cursorY + tdY, true ) ) {
							
								onWall = true;
								continue;								
							}
						}
					}

				}
				
				// determine speed on which to ignore all forces
				var intSpeedLimit = -1;
				if ( __speedLimit != "Never" ) intSpeedLimit = __speedPresets[ __speedLimit.split( " " ).join( "" ).toLowerCase( ) ];

				// if speed < intSpeedLimit AND displacement is allowed -> displace
				if ( disableDisplacement || ( numDst <= intSpeedLimit || intSpeedLimit == -1 || getCursor( i ).__mouselink == false ) ) {
					displaceCursor( i, tdX, tdY );
//					if ( getCursor( i )._parent != _root ) {
//						getCursor( i )._parent.update( );
//					}						
				} else {
					displaceCursor( i, MouseMovX, MouseMovY );
				}
				

				// remove all forces & dimmers stored about this cursor
				forces[ i ].length = 0;
				dimmers[ i ].length = 0;								

			
				// Reduce the cursor's speed.
				// Amount of speed reduction depends on both cursor grip
				// and surface grip, which are both recorded in the Cursor.
				var slowdown = 1 - ( cur.grip / 100 );
				
				slowdown = Math.pow( slowdown, cur.surfaceGrip );
				slowdown = Math.pow( slowdown, timeFactor );
				
				cur.setSpeed( cur.xSpeed * slowdown, cur.ySpeed * slowdown );
				
				if ( cur.mouseAsForce ) {
					
					var gripPush = Math.max( 1 - cur.surfaceGrip, 0 );

					if ( gripPush > 0 ) {
						
						var ff = 100 / __baseForce;
						addForce( i, MouseMovX * ff * gripPush, MouseMovY * ff * gripPush, targetPath( this ) );
						
					}
					
				}
				
				cur.surfaceGrip = 1;
				


				// Bounce the cursor back if it leaves the stage before the real cursor
				
				var curx = cur.xPosition;
				var cury = cur.yPosition;
				
				if ( curx < SystemManager.screen.x || curx > SystemManager.screen.width - SystemManager.screen.x ) {
					
					addForce( i, ( _root._xmouse - curx ) / 8, ( _root._ymouse - cury ) / 16, targetPath( this ) )
				}
				if ( cury < SystemManager.screen.y || cury > SystemManager.screen.height - SystemManager.screen.y ) {

					addForce( i, ( _root._xmouse-curx ) / 16, ( _root._ymouse - cury ) / 8, targetPath( this ) )
				}
				
			}
			
		}


		
		// Save the current mouse position
		oldXMouse = _root._xmouse + MouseDispX;
		oldYMouse = _root._ymouse + MouseDispY;

	}
	//
	// End heartbeat
	//




	/*
	* findTopmost
	* 
	*/
	
	private function findTopmost( senders:Array ):Number {

		if ( senders.length > 1 ) {
		
			var nesting = 0;
			var unsure = true;
	
			var depth:Array = new Array( );
			var candidate:Array = new Array( );
			var topmost:Number;
			
			// disect the senders' paths
			for ( var i=0; i<senders.length; i++ ) {
				senders[ i ] = senders[ i ].split( "." );
				candidate[ i ] = true;
			}
			
			while ( unsure && nesting < 100 ) {
				
				nesting++;
				unsure = false;
			
				// recreate the paths to a certain level of nesting
				for ( var i=0; i<senders.length; i++ ) {
					
					var path:String;
					
					if ( candidate[ i ] ) {

						// create a partial path 
						path = senders[ i ][ 0 ];
						for ( var n=1; n<nesting; n++ ) {
							path += "." + senders[ i ][ n ];
						}
					}
					
					// get depth of movieclip at that path
					if ( eval( path ) != undefined ) {
						depth[ i ] = eval( path ).getDepth( );
					} else {
						depth[ i ] = -20000;
					}
					
				}
				
				// compare depths				
				topmost=0;
				
				for ( var i=1; i<depth.length; i++ ) {
					
					if ( depth[ i ] > depth[ topmost ] ) {
						topmost = i;
						candidate[ i ] = true;
						for ( var j=0; j<i; j++ ) {
							candidate[j] = false;
						}
						unsure = false;
						
					} else {
						
						if ( depth[ i ] == depth[ topmost ] ) {
							unsure = true;
							candidate[ i ] = true;
						} else {
							candidate[ i ] = false;
						}
					}
					
				}
					
			}
			
			return topmost;
			
		} else {
			
			return 0;
		}			
	}	
}