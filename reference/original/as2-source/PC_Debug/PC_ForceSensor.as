/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* 
*  PC_FORCESENSOR
* 
* The ForceSensor is a special kind of cursor. When 
* the Engine sends it a displacement, it does not 
* reposition itself, but instead it draws an arrow 
* indicating the direction and strength of the 
* displacement. In this way, the ForceSensor can be 
* used to inspect the forces at a particular point 
* of the stage. It was included as a authoring tool, 
* not to be included in any final design.
* 
****************************************************/

class PC_Debug.PC_ForceSensor extends PC_Cursors.PC_Cursor {


	// Vars
	//--------------------------------------
	private var forceArrow:MovieClip;
	
	private var currXForce:Number = 0;
	private var currYForce:Number = 0;
	private var timeCounter:Number = 0;
	private var xf_array:Array;
	private var yf_array:Array;

	private var __isball:Boolean = false;

	private var __mouselink:Boolean = true;
	private var __mouseasforce:Boolean = false;

	private var __averaging:Number;
	private var __updateTime:Number;


	// Inspectables
	//--------------------------------------

	// Over how many frames the ForceSensor should average
	// its forces. Not averaging (by setting this parameter
	// to 1) leads to a very irregular display.
	[Inspectable(type="Number", defaultValue=7, name="Averaging (frames)")]
	public function set averaging(newAveraging:Number):Void {
		if (newAveraging >= 1) {
			__averaging = Math.round(newAveraging);
		} else {
			__averaging = 1;
		}
	}
	public function get averaging():Number {
		return __averaging;
	}

	// How often the ForceSensor should redraw itself.
	// Minimum = 1 (every frame).
	[Inspectable(type="Number", defaultValue=1, name="Update time (frames)")]
	public function set updateTime(newUpdateTime:Number):Void {
		if (newUpdateTime >= 1) {
			__updateTime = Math.round(newUpdateTime);
		} else {
			__updateTime = 1;
		}
	}
	public function get updateTime():Number {
		return __updateTime;
	}
	

	// Constructor
	//--------------------------------------
	function PC_ForceSensor() {

		xf_array = new Array();
		yf_array = new Array();
		
		// the Heartbeat should be executed every frame
		this.onEnterFrame = function() {
			heartbeat();
		};

	}


	// Init & Draw methods
	//--------------------------------------
	function init(Void):Void {	
		
		graphics_mc = this;
		
		super.init();
	}


	function draw(Void):Void {	
		
		super.draw();
	}

	// Custom functions
	//--------------------------------------
	function displace(xForce:Number, yForce:Number) {

		// whenever the displace function is called, the ForceSensor
		// does not displace itself; it just 
		currXForce = xForce;
		currYForce = yForce;
	}


	function position(xpos:Number, ypos:Number) {

	}

	
	// computes the average of an array
	function avg(arr:Array):Number {
		
		var returnValue:Number = 0;
		
		for(var i=0; i < arr.length; i++) {
			returnValue += arr[i]
		}
		
		return returnValue/__averaging;
	}


	function heartbeat() {
		
		// every frame, store that frame's force in the arrau
		var i = timeCounter % __averaging;
				
		xf_array[i] = currXForce;
		yf_array[i] = currYForce;
		
		currXForce = 0;
		currYForce = 0;

		timeCounter = timeCounter + 1;
		
		// if it's a draw-the-arrow frame
		if (timeCounter % __updateTime == 0) {
			
			// Calculate arrow size from arrays:
			
			var xf = avg(xf_array);
			var yf = avg(yf_array);
		
			// Draw arrow:
			
			if (yf>0) {
				forceArrow._rotation = 180 + Math.atan(xf/-yf) * 180 / Math.PI;
			} else {
				forceArrow._rotation =       Math.atan(xf/-yf) * 180 / Math.PI;
			}
			
			forceArrow._xscale = 50 * Math.sqrt(Math.sqrt(xf*xf + yf*yf));
			forceArrow._yscale = forceArrow._xscale;

			// keep the timeCounter from increasing too much
			
			timeCounter %= (__averaging * __updateTime);

		}	
	}


	
}