/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* 
*  PC_WALLMAKER
* 
* The PC_WallMaker is a modifier version of the
* PC_Wall object. It works exactly like that
* object, except that the WallMaker has no shape
* itself and is meant to create a wall in a custom
* shape. The WallMaker applies its wall-making
* ability to its parent object.
* 
****************************************************/

class PC_Behaviours.PC_WallMaker extends PC_Behaviours.PC_Behaviour {


	// Constructor
	//--------------------------------------
	function PC_WallMaker()	{
	}


	// Init & Draw methods
	//--------------------------------------
	function init(Void):Void {
		
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
		
		super.draw();
	}


}