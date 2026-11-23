/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, January 2007, by Pascal de Man
* 
*  PC_GRID
* 
*
****************************************************/

class PC_Debug.PC_Grid extends MovieClip {

	// Vars
	//--------------------------------------

	// MovieClips
	private var mc_image:MovieClip;
	private var mc_output:MovieClip;
	private var mc_pointer:MovieClip;
	
	// Values
	private var objGridSize:Object = { width: this._width, height: this._height };						 
	private var arrGridCols:Array = new Array( );
	private var intCurrentCol:Number = 0;
	private var intCurrentRow:Number = 0;

	// Properties
	private var __gridpoints:Number;
	private var __linesize:Number;
	private var __linecolor:Number;
	private var __draggable:Boolean;
	
	private var __cellsize:Number;
	private var __dragging:Boolean = false;
	private var __updateinterval:Number;
	
	
	// Getters and setters
	//--------------------------------------	
	
	// Get and set gridPoints
	[Inspectable(type="Number", defaultValue=100, name="gridPoints")]
	public function set gridPoints( gridPoints:Number ):Void {
		__gridpoints = gridPoints;
	}
	public function get gridPoints( ):Number {
		return __gridpoints;
	}
	
	// Get and set lineSize
	[Inspectable(type="Number", defaultValue=1, name="lineSize")]
	public function set lineSize( lineSize:Number ):Void {
		__linesize = lineSize;
	}
	public function get lineSize( ):Number {
		return __linesize;
	}
	
	// Get and set lineColor
	[Inspectable(type="Color", defaultValue=0x000000, name="lineColor")]
	public function set lineColor( lineColor:Number ):Void {
		__linecolor = lineColor;
	}
	public function get lineColor( ):Number {
		return __linecolor;
	}
	
	// Get and set draggable
	[Inspectable(type="Boolean", defaultValue=true, name="draggable")]
	public function set draggable( draggable:Boolean ):Void {
		__draggable = draggable;
	}
	public function get draggable( ):Boolean {
		return __draggable;
	}


	// Constructor
	//--------------------------------------
	
	function PC_Grid( ) {
		
		// Init PowerGrid
		init( );
	}


	// Init, update & draw methods
	//--------------------------------------	
	
	private function init( Void ):Void {	
		
		calculateCellSize( );
	
		// Hide dummy-graphics
		this.mc_image._visible = false;	

		// Init grid-array
		this.arrGridCols = new Array( );
		
		// Create new output-clip
		this.createEmptyMovieClip( "mc_output", this.getNextHighestDepth( ) );	
		
		// Calculate the number of hoizontal and vertical gridpoints
		var intPointsX = Math.ceil( this._width  / __cellsize ) + 1;
		var intPointsY = Math.ceil( this._height / __cellsize ) + 1;
		
		// Reset movieclip-scale
		this._xscale = 100;
		this._yscale = 100;
		
		// Store gridpoints
		for ( var i=0; i<intPointsX; i++ ) {
			
			var arrGridCol = new Array( );
			
			for ( var n=0; n<intPointsY; n++ ) {
				
				// Get global gridpoint-location																   
				arrGridCol.push( { xIndex: i * __cellsize, 	      // initial x-location
								   yIndex: n * __cellsize,	      // initial y-location
								   xPosition: i * __cellsize,  	  // updated x-location
								   yPosition: n * __cellsize } ); // updated y-location
			}
			
			this.arrGridCols.push( arrGridCol );
		}
		
		this.mc_pointer._x = this._x;
		this.mc_pointer._y = this._y;
		
		update( );
	}	
	
	// Update PowerGrid
	// ( Will be executed at every heartbeat )
	private function update( Void ):Void {	
	
		if ( __dragging ) this.draw( );
		else {
			if ( _root.hitTest( mc_pointer._x, mc_pointer._y, true ) ) {			
				var objGridPoint = this.arrGridCols[ intCurrentCol ][ intCurrentRow ];

				objGridPoint.xPosition = mc_pointer._x - this._x;
				objGridPoint.yPosition = mc_pointer._y - this._y;
			}
			
			intCurrentCol++;
			if ( intCurrentCol == arrGridCols.length ) {
				intCurrentCol = 0;
				intCurrentRow++;
				
				if ( intCurrentRow == arrGridCols[ 0 ].length ) {
					intCurrentRow = 0;
				}
			}
			
			
			// Calculate global gridpoint-location
			var objNextGridPoint = this.arrGridCols[ intCurrentCol ][ intCurrentRow ];		
			
			// Position 'fake' cursor			
			mc_pointer.setPosition( objNextGridPoint.xIndex + this._x, objNextGridPoint.yIndex + this._y );	
															
			if ( _root.hitTest( objNextGridPoint.xIndex + this._x, objNextGridPoint.yIndex + this._y, true ) ) {
				
				this.draw( );		
			} else {
				
				this.update( );
			}
		}
	}
	
	
	// Draw PowerGrid
	// ( Will only be executed from the update-script )
	private function draw( Void ):Void {
		
		// Empty output-clip
		this.mc_output.clear( );
		this.mc_output.lineStyle( __linesize, __linecolor, 100 );		
		
		// Redraw grid
		for ( var i=0; i<this.arrGridCols.length; i++ ) {
			
			for ( var n=0; n<this.arrGridCols[ i ].length; n++ ) {			
				
				// Store start-location								
				var objStartLoc = { x:this.arrGridCols[ i ][ n ].xPosition, 
									y:this.arrGridCols[ i ][ n ].yPosition };
				
				// Draw horizontal line
				if ( this.arrGridCols[ i + 1 ][ n ].xPosition != undefined ) {			
					
					// Jump to start-location
					this.mc_output.moveTo( objStartLoc.x, objStartLoc.y );
				
					// Store end-location								
					var objEndLoc = { x:this.arrGridCols[ i + 1 ][ n ].xPosition, 
									  y:this.arrGridCols[ i + 1 ][ n ].yPosition };
					
					// Draw line from start- to end-location
					this.mc_output.lineTo( objEndLoc.x, objEndLoc.y );
				}
				
				// Draw vertical line
				if ( this.arrGridCols[ i ][ n + 1 ].yPosition != undefined ) {
					
					// Jump to start-location
					this.mc_output.moveTo( objStartLoc.x, objStartLoc.y );
				
					// Store end-location								
					var objEndLoc = { x:this.arrGridCols[ i ][ n + 1 ].xPosition, 
									  y:this.arrGridCols[ i ][ n + 1 ].yPosition };

					// Draw line from start- to end-location
					this.mc_output.lineTo( objEndLoc.x, objEndLoc.y );
				}
			}
		}
		
		if ( __draggable ) {
			this.mc_image._x = this.arrGridCols[ 0 ][ 0 ].xPosition;
			this.mc_image._y = this.arrGridCols[ 0 ][ 0 ].yPosition;
			
			this.mc_image._width  = this.mc_output._width;
			this.mc_image._height = this.mc_output._height;
			
			this.mc_image._alpha = 0;
			this.mc_image._visible = true;
			
			this.mc_image.onMouseUp = function( ) { 
				if ( this._parent.__dragging ) this._parent.endDrag( );
			}
		} else {
			this.mc_image.PC_Dragbehaviour.__rolloverCursorStyle = "Null";
		}
	}
	
	
	// Custom functions
	//--------------------------------------
		
	private function calculateCellSize( Void ):Void {
		
		var boolChecked = false;
		var intCellSize = 1;
		
		while ( !boolChecked ) {
			if ( Math.ceil( this._width / intCellSize ) * Math.ceil( this._height / intCellSize ) > __gridpoints ) {
				intCellSize ++;
			} else {
				boolChecked = true;
			}
		}
		
		__cellsize = intCellSize;
	}
	
	public function beginDrag( ) {
		
		if ( __draggable ) {
		
			__dragging = true;
			this.startDrag( );
			
			mc_pointer.forces = new Array( );
			mc_pointer.dimmers = new Array( );
			
			for ( var i=0; i<this.arrGridCols.length; i++ ) {			
				for ( var n=0; n<this.arrGridCols[ i ].length; n++ ) {			
					this.arrGridCols[ i ][ n ].xPosition = i * __cellsize; 
					this.arrGridCols[ i ][ n ].yPosition = n * __cellsize;
				}
			}		
		}
	}
	
	public function endDrag( ) {
		
		if ( __draggable ) {			
		
			__dragging = false;			
			stopDrag( );
		}
	}
}