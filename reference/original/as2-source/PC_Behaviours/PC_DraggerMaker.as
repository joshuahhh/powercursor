/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* 
*  PC_DRAGGERMAKER
* 
* The PC_ButtonMaker does not displace cursors. 
* Instead, it uses PowerCursor’s events and an 
* event listener to create button-like behaviour.
* When the ButtonMaker is touched by a cursor, it 
* can jump to a different frame of its parent 
* MovieClip. On a mouse click, the ButtonMaker 
* can move to yet another frame. 
* 
****************************************************/

class PC_Behaviours.PC_DraggerMaker extends PC_Behaviours.PC_Behaviour {


	// Vars
	//--------------------------------------
	private var prevX:Number;
	private var prevY:Number;

	private var dragging:String = "";
	private var	dragStopper:Number = 0;
	
	private var dragListener:Object;


	// Constructor
	//--------------------------------------
	function PC_DraggerMaker( )	{
		
		this.onEnterFrame = function( ) {
			handleDrag( );
			heartbeat( );
		};
		
		dragListener = new Object( );
		
		createListener( );		
	}
	
	
	// Custom Methods
	//--------------------------------------

	private function handleDrag( ) {
		
		if ( dragging != "" ) {
		
			var cur:MovieClip;
			cur = eval( String( dragging ) );

			hitTestTarget._x += cur.xLastDisp;
			hitTestTarget._y += cur.yLastDisp;			
		}
		
		if ( dragStopper > 0 ) {
			
			if ( dragStopper++ > 10 ) {
				stopDrag( );
				dragStopper = 0;
			}
		}		
	}
	
	private function startDrag( curPath ) {
		dragStopper = 0;
		dragging = curPath;
		prevX = eval( curPath )._x;
		prevY = eval( curPath )._y;
	}

	private function stopDrag( ) {
		dragging = "";
	}

	private function delayedStopDrag( ) {
		dragStopper = 1;
	}
	
	private function cancelDelayedStop( ) {
		dragStopper = 0;
	}

	
	// THis constructs the DraggerMaker's listener and 
	// attaches it to its parent.
	private function createListener( ) {
		
		var et:MovieClip = eventTarget;
		var dm:MovieClip = this;

		dragListener.pc_mousedown = function( eventObj:Object ) {			
			dm.startDrag( eventObj.path );
			
			// starts dragging around the grid-object
			dm._parent._parent.beginDrag( );
		};
		dragListener.pc_mouseup = function( eventObj:Object ) {
			dm.stopDrag( );
			
			// stops dragging around the grid-object
			dm._parent._parent.endDrag( );
		};
		dragListener.pc_rollout = function( eventObj:Object ) {
			dm.delayedStopDrag( );
		};
		dragListener.pc_rollin = function( eventObj:Object ) {
			dm.cancelDelayedStop( );
		};
		
		eventTarget.addEventListener( "pc_mousedown", dragListener );
		eventTarget.addEventListener( "pc_mouseup", dragListener );
		eventTarget.addEventListener( "pc_rollin", dragListener );
		eventTarget.addEventListener( "pc_rollout", dragListener );
	}		
}