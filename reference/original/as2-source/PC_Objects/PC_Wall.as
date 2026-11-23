/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
*
*  PC_WALL
*
* While other objects act on any cursor that
* touches it, the PC_Wall is an object that cannot
* be touched at all. When the Engine is about to
* displace a cursor, it first checks whether this
* displacement would position it on a wall. If this
* is the case, the displacement is cancelled and
* the Engine will try to find an alternative
* movement that will not put the cursor on any
* wall. Although this makes it impossible to move a
* cursor through a wall area, it is possible to
* ‘jump’ over a wall by moving the mouse briskly.
* This can cause the cursor to move from one side
* of the wall object to the other without touching
* it.
*
****************************************************/

class PC_Objects.PC_Wall extends PC_Objects.PC_ReadyMadeObject {


	// Vars
	//--------------------------------------

	private var graphics:MovieClip;
	private var visualisation:MovieClip;

	private var __tint:Color;



	// Inspectables
	//--------------------------------------

	// Tint is the colour of the object’s rectangle.
	[Inspectable(type="Color", defaultValue="#B35959", name="Graphics Tint", category="Graphics")]
	public function set tint(newTint:Color):Void {
		__tint = newTint;
		draw();
	}
	public function get tint():Color {
		return __tint;
	}


	// Constructor
	//--------------------------------------
	function PC_Wall()	{
	}


	// Init & Draw methods
	//--------------------------------------
	function init(Void):Void {

		// remove the 'preview' graphics that are visible in the authoring environment
		this.graphics._alpha = 0;

          	this.onLoad = function() {

                        if (_root.PC_Engine.hideAllObjects) {
				this._alpha = 0;
			}

                        // notify the Engine we're here
			_root.PC_Engine.addWall(targetPath(hitTestTarget));

		};

//		super.init();


	}


	function draw(Void):Void {

		// remove the old visualisation & shading

		this.visualisation.removeMovieClip();

		// add a visualisation to this object

		var v:MovieClip;

		v = this.attachMovie("PC_Square", "visualisation", this.getNextHighestDepth());

		// apply a color to the object's visualisation

		var col = new Color(this.visualisation);
		var untypedTint = __tint;
		col.setRGB(untypedTint);

		v._x = v._width/2;
		v._y = v._height/2;


		super.draw();
	}

}