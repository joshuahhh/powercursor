/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* V1.1, August 2007, by Mensvoort/de Man
* 
*  PC_EVENTDISPATCHER
* 
* The PC_EventDispatcher is an empty subclass of
* PC_Modifier. It does nothing more than dispatch
* the standard PowerCursor events that every object
* dispatches when its parent its parent MovieClip
* is touched by cursors.
* 
****************************************************/

class PC_Behaviours.PC_EventDispatcher extends PC_Behaviours.PC_Behaviour {
	
	// Vars
	//--------------------------------------		
	private var __eventlistener:Object;
	

	// Inspectables
	//--------------------------------------

	[Inspectable(type="String", enumeration="pc_mouseup,pc_mousedown,pc_rollin,pc_rollover,pc_rollout", defaultValue="pc_mouseup", name="Event")]
	var __event:String;
	 public function set event(newEvent:String):Void {
		__event = newEvent;
		 
	}
	public function get event():String {
		return __event;
	}


	// Store Action, Prameter(s) and Target
	[Inspectable(type="String", defaultValue="gotoAndPlay", name="Action")]
	private var __action:String;
	
	[Inspectable(type="String", defaultValue="1", name="Parameter")]
	private var __param:String;
	
	[Inspectable(type="String", defaultValue="this", name="Target")]
	private var __target:String;

	// Constructor
	//--------------------------------------
	function PC_EventDispatcher( )	{
		createListener( );
	}
	
	 
	// Custom Methods
	//--------------------------------------
	
	private function getAction( Void ):Object {		
		return { action:__action, parameter:__param, target:__target };
	}
	
	function getTarget( objButton:MovieClip, strTarget:String ) {
		var arrTarget = strTarget.split( "." );
		var objTarget = objButton._parent;		
		
		if ( strTarget != "" ) {
			for ( var i=0; i<arrTarget.length; i++ ) {
				switch( arrTarget[ i ] ) {
					case "_root": 
						objTarget = _root; 
						break;
					case "_parent": 
						objTarget = objTarget._parent; 
						break;
					default: 
						objTarget = objTarget[ arrTarget[ i ] ]; 
						break;
				}
			}
		}
		
		return objTarget;		
	}
	
	private function createListener( ) {		
		var eventtarget:MovieClip = this;
		
		__eventlistener = new Object( );
		__eventlistener.pc_rollout = function( eventObj:Object ) {	
			var objAction = eventtarget.getAction( );	
			if ( objAction != -1 ) {
				var objTarget = eventtarget.getTarget( eventtarget._parent, objAction[ 'target' ] );				
				objTarget[ objAction[ 'action' ] ].call( objTarget, objAction[ 'parameter' ] );
			}
		};
		
		__eventlistener.pc_rollover = function( eventObj:Object ) {			
			var objAction = eventtarget.getAction( );
			if ( objAction != -1 ) {
				var objTarget = eventtarget.getTarget( eventtarget._parent, objAction[ 'target' ] );				
				objTarget[ objAction[ 'action' ] ].call( objTarget, objAction[ 'parameter' ] );
			}
		};
		
		__eventlistener.pc_rollin = function( eventObj:Object ) {
			var objAction = eventtarget.getAction( );
			if ( objAction != -1 ) {
				var objTarget = eventtarget.getTarget( eventtarget._parent, objAction[ 'target' ] );				
				objTarget[ objAction[ 'action' ] ].call( objTarget, objAction[ 'parameter' ] );
			}
		};
		
		__eventlistener.pc_mousedown = function( eventObj:Object ) {
			var objAction = eventtarget.getAction( );
			if ( objAction != -1 ) {
				var objTarget = eventtarget.getTarget( eventtarget._parent, objAction[ 'target' ] );				
				objTarget[ objAction[ 'action' ] ].call( objTarget, objAction[ 'parameter' ] );
			}
		};
		
		__eventlistener.pc_mouseup = function( eventObj:Object ) {			
			var objAction = eventtarget.getAction( );			
			if ( objAction != -1 ) {
				var objTarget = eventtarget.getTarget( eventtarget._parent, objAction[ 'target' ] );				
				objTarget[ objAction[ 'action' ] ].call( objTarget, objAction[ 'parameter' ] );
			}
		};
		

		this._parent.addEventListener( __event, __eventlistener );
	}	
}