/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* 
*  PC_READYMADEOBJECT
*
****************************************************/

class PC_Objects.PC_ReadyMadeObject extends PC_Objects.PC_Object {

	private var graphics:MovieClip;
	

	// Constructor
	//--------------------------------------
	function PC_ReadyMadeObject()	{

		hitTestTarget = graphics;
		eventTarget = this;

		mx.events.EventDispatcher.initialize(eventTarget);
	}
}