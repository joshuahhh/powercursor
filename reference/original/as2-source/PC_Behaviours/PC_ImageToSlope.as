/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, July 2007, by Mensvoort/de Man
* 
*  PC_ImageToSlope
* 
****************************************************/
import flash.display.BitmapData;
import flash.filters.BlurFilter;
import flash.geom.Point;

class PC_Behaviours.PC_ImageToSlope extends PC_Behaviours.PC_Behaviour {


	// Vars
	//--------------------------------------
	private var __screenshot:MovieClip;
	
	private var __accuracy:String;
	private var __accuracies:Object = { veryhigh:0,
									    high:5,
										average:10,
										low:20,
										verylow:50 };
	private var __adaptiveforce:Boolean;
	
	private var __strength:Number = 0;
	private var __angle:Number = 0;
	
	private var __mincolor:Number;
	private var __maxcolor:Number;
	
	private var __checkdst:Number = 5;
	private var __maxstrength:Number = 0.4;


	// Inspectables
	//--------------------------------------
	
	// Accuracy: The number with which the screenshotted image is blurred
	[Inspectable(type="String", enumeration="Very High,High,Average,Low,Very Low", defaultValue="Average", name="Accuracy", category="Force")]
	public function set accuracy( newAccuracy:String ):Void {
		__accuracy = newAccuracy;
	}
	public function get accuracy( ):String {
		return __accuracy;
	}
	
	// Adaptive Force: Determines if the forces are calcultated depending on 
	// all possible colors, or all colors used in the image
	[ Inspectable( type="Boolean", defaultValue=true, name="Adapt to Colorspectrum", category="Force" ) ]
	public function set adaptiveforce( newAdaptiveForce:Boolean ):Void {
		__adaptiveforce = newAdaptiveForce;
	}
	public function get adaptiveforce( ):Boolean {
		return __adaptiveforce;
	}



	// Constructor
	//--------------------------------------
	function PC_ImageToSlope( ) {
		__mincolor = 0xFFFFFF;
		__maxcolor = 0x000000;
		
		if ( !__adaptiveforce ) {
			var objScreenshotData:BitmapData = new BitmapData( eventTarget._width, eventTarget._height, true );
			objScreenshotData.draw( eventTarget );
			
			for ( var i=0; i<eventTarget._width; i++ ) {				
				for ( var n=0; n<eventTarget._height; n++ ) {
					var intColor32 = objScreenshotData.getPixel32( i, n );
					
					var intAlpha = ( intColor32 >> 24 & 0xFF );	
					var boolIgnoreColor = ( intColor32 == -1 );							

					if ( intAlpha != 0 && !boolIgnoreColor ) {		
						var objColor = objScreenshotData.getPixel( i, n );

						__mincolor = Math.min( __mincolor, objColor );
						__maxcolor = Math.max( __maxcolor, objColor );
					}
				}
			}
		} else {					
			__mincolor = 0x000000;
			__maxcolor = 0xFFFFFF;
		}
	}


	// Custom Methods
	//--------------------------------------
	
	// This function (called by PC_ObjectHeart) exerts force on a cursor
	function applyForce( i:Number, relx:Number, rely:Number, globalx:Number, globaly:Number ):Void {
		
		// Create image-object
		var objScreenshotData:BitmapData = new BitmapData( eventTarget._width, eventTarget._height, true );
		objScreenshotData.draw( eventTarget );
		
		// Apply blurFilter
		var intBlurValue = __accuracies[ __accuracy.split( " " ).join( "" ).toLowerCase( ) ];
		var objBlurFilter:BlurFilter = new BlurFilter( intBlurValue, intBlurValue, 1 );
		objScreenshotData.applyFilter( objScreenshotData, objScreenshotData.rectangle, new Point( 0, 0 ), objBlurFilter );
		
		// Get cursor-loc
		var objCursorLoc = { x: Math.round( _root.PC_Engine.getCursor( i )._x - eventTarget._x ),
							 y: Math.round( _root.PC_Engine.getCursor( i )._y - eventTarget._y ) };

		// Analyse image and store colorvalues 
		var arrColorGrid = new Array( objScreenshotData.getPixel( Math.max( 0, objCursorLoc.x - __checkdst ), Math.max( 0, objCursorLoc.y - __checkdst ) ),  				  // left-top
									  objScreenshotData.getPixel( objCursorLoc.x, Math.max( 0, objCursorLoc.y - __checkdst ) ), 											  // top
									  objScreenshotData.getPixel( Math.min( objCursorLoc.x + __checkdst, eventTarget._width ), Math.max( 0, objCursorLoc.y - __checkdst ) ),  // right-top
									  objScreenshotData.getPixel( Math.max( 0, objCursorLoc.x - __checkdst ), objCursorLoc.y ), 											  // left	  
									  objScreenshotData.getPixel( objCursorLoc.x, objCursorLoc.y ), 																		  // center
									  objScreenshotData.getPixel( Math.min( objCursorLoc.x + __checkdst, eventTarget._width ), objCursorLoc.y ),							  // right
									  objScreenshotData.getPixel( Math.max( 0, objCursorLoc.x - __checkdst ), Math.min( objCursorLoc.y + __checkdst, eventTarget._height ) ), // left-bottom
									  objScreenshotData.getPixel( objCursorLoc.x, Math.min( objCursorLoc.y + __checkdst, eventTarget._height ) ),							  // bottom
									  objScreenshotData.getPixel( Math.min( objCursorLoc.x + __checkdst, eventTarget._width ), Math.min( objCursorLoc.y + __checkdst, eventTarget._height ) ) 	// right-bottom 
									 );
		
		// Assemble force & angle-list
		var arrForces = new Array( );
		if ( arrColorGrid[ 3 ] - arrColorGrid[ 4 ] != 0 ) arrForces.push( { angle: 270, value:( arrColorGrid[ 3 ] - arrColorGrid[ 4 ] ) } ); // left
		if ( arrColorGrid[ 5 ] - arrColorGrid[ 4 ] != 0 ) arrForces.push( { angle:  90, value:( arrColorGrid[ 5 ] - arrColorGrid[ 4 ] ) } ); // right
		if ( arrColorGrid[ 1 ] - arrColorGrid[ 4 ] != 0 ) arrForces.push( { angle:   0, value:( arrColorGrid[ 1 ] - arrColorGrid[ 4 ] ) } ); // top 
		if ( arrColorGrid[ 7 ] - arrColorGrid[ 4 ] != 0 ) arrForces.push( { angle: 180, value:( arrColorGrid[ 7 ] - arrColorGrid[ 4 ] ) } ); // bottom
		if ( arrColorGrid[ 0 ] - arrColorGrid[ 4 ] != 0 ) arrForces.push( { angle: 315, value:( arrColorGrid[ 0 ] - arrColorGrid[ 4 ] ) } ); // left-top
		if ( arrColorGrid[ 2 ] - arrColorGrid[ 4 ] != 0 ) arrForces.push( { angle:  45, value:( arrColorGrid[ 2 ] - arrColorGrid[ 4 ] ) } ); // right-top
		if ( arrColorGrid[ 6 ] - arrColorGrid[ 4 ] != 0 ) arrForces.push( { angle: 225, value:( arrColorGrid[ 6 ] - arrColorGrid[ 4 ] ) } ); // left-bottom
		if ( arrColorGrid[ 8 ] - arrColorGrid[ 4 ] != 0 ) arrForces.push( { angle: 135, value:( arrColorGrid[ 8 ] - arrColorGrid[ 4 ] ) } ); // right-bottom
		arrForces.sortOn( "value", Array.NUMERIC );
		
		// Calculate correct angle & force
		if ( arrForces.length == 0 ) {
			__angle = 0;		
			__strength = 0;
		} else if ( arrForces[ 0 ].value == 0 ) {
			__angle = 0;		
			__strength = 0;
		} else {
			__angle = arrForces[ 0 ].angle;
			__strength = Math.min( __maxstrength, ( Math.abs( arrForces[ 0 ].value - __mincolor ) / ( __maxcolor - __mincolor ) ) * 100 );
		}

		// Apply the force, with the right strength in the right direction
		_root.PC_Engine.addForce( i,
			__strength *  Math.sin( ( ( __angle + totalRotation( this ) ) * 2 * Math.PI ) / 360 ),
			__strength * -Math.cos( ( ( __angle + totalRotation( this ) ) * 2 * Math.PI ) / 360 ),
		targetpath( eventTarget ) )
	}		
}