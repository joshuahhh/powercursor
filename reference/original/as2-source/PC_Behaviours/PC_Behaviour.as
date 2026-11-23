/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* 
*  PC_MODIFIER
* 
****************************************************/

class PC_Behaviours.PC_Behaviour extends PC_Objects.PC_Object {
	

	// Vars
	//--------------------------------------
	private var graphics:MovieClip;
	
	// Constructor
	//--------------------------------------
	function PC_Behaviour()	{

		hitTestTarget = _parent;
		eventTarget = _parent;

		this.graphics.unloadMovie();
		
		mx.events.EventDispatcher.initialize(eventTarget);

	}

}