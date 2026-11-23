/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* 
*  PC_BUTTONMAKER
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
class PC_Behaviours.PC_ButtonMaker extends PC_Behaviours.PC_Behaviour {
	// Vars
	//--------------------------------------
	private var __outframe;
	private var __overframe;
	private var __downframe;
	private var __upframe;
	private var buttonListener:Object;
	private var __rolloverCursorStyle;
	
	// Inspectables
	//--------------------------------------
	// Graphic styles of the cursor when rolling over button. 
	[Inspectable(type="String", enumeration="Finger,Default,Ball,GrabHand,Arrow", defaultValue="Finger", name="CursorStyle", category="Button")]
	 public function set rolloverCursorStyle(newRolloverCursorStyle:String):Void {
		__rolloverCursorStyle = newRolloverCursorStyle;
		 
	}
	public function get rolloverCursorStyle():String {
		return __rolloverCursorStyle;
	}
	// This is the frame the ButtonMaker’s parent MovieClip
	// will jump to when there is no cursor on it. 
	[Inspectable(defaultValue=1, name="(1) 'Out' frame", category="Button")]
	 public function set outframe(newOutframe):Void {
		if (typeof (newOutframe) == "number") {
			if (newOutframe>0) {
				__outframe = newOutframe;
			} else {
				__outframe = 1;
			}
		} else {
			if (typeof (newOutframe) != "string") {
				__outframe = 1;
			} else {
				__outframe = newOutframe;
			}
		}
	}
	public function get outframe() {
		return __outframe;
	}
	// This is the frame the ButtonMaker’s parent MovieClip
	// will jump to when a cursor enters its aera.
	[Inspectable(defaultValue=2, name="(2) 'Over' frame", category="Button")]
	 public function set overframe(newOverframe):Void {
		if (typeof (newOverframe) == "number") {
			if (newOverframe>0) {
				__overframe = newOverframe;
			} else {
				__overframe = 2;
			}
		} else {
			if (typeof (newOverframe) != "string") {
				__overframe = 2;
			} else {
				__overframe = newOverframe;
			}
		}
	}
	public function get overframe() {
		return __overframe;
	}
	// This is the frame the ButtonMaker’s parent MovieClip
	// will jump to when there there is a mouseclick while 
	// it has cursors on it. 
	[Inspectable(defaultValue=3, name="(3) 'Down' frame", category="Button")]
	 public function set downframe(newDownframe):Void {
		if (typeof (newDownframe) == "number") {
			if (newDownframe>0) {
				__downframe = newDownframe;
			} else {
				__downframe = 3;
			}
		} else {
			if (typeof (newDownframe) != "string") {
				__downframe = 3;
			} else {
				__downframe = newDownframe;
			}
		}
	}
	public function get downframe() {
		return __downframe;
	}
	// This is the frame the ButtonMaker’s parent MovieClip
	// will jump after it has been clicked. 
	[Inspectable(defaultValue=2, name="(4) 'Up' frame", category="Button")]
	 public function set upframe(newUpframe):Void {
		if (typeof (newUpframe) == "number") {
			if (newUpframe>0) {
				__upframe = newUpframe;
			} else {
				__upframe = 2;
			}
		} else {
			if (typeof (newUpframe) != "string") {
				__upframe = 2;
			} else {
				__upframe = newUpframe;
			}
		}
	}
	public function get upframe() {
		return __upframe;
	}
	// Constructor
	//--------------------------------------
	function PC_ButtonMaker() {
		_parent.gotoAndStop(__outframe);
		buttonListener = new Object();
		createListener();
	}
	
	 
	// Custom Methods
	//--------------------------------------
	// THis constructs the ButtonMaker's listener and 
	// attaches it to its parent.
	private function createListener() {
		//var cu:Number = i;
		var et:MovieClip = eventTarget;
		var ou = __outframe;
		var ov = __overframe;
		var dn = __downframe;
		var up = __upframe;
		var ros=  __rolloverCursorStyle;
		buttonListener.pc_rollout = function(eventObj:Object) {
			_root.PC_Engine.setCursorStyle("Default", String(eventObj.cursorIndex));
			if (ou<>"null"){ et.gotoAndStop(ou)};
		};
		buttonListener.pc_rollover = function(eventObj:Object) {
			 
			_root.PC_Engine.setCursorStyle(ros, String(eventObj.cursorIndex));
		};
		buttonListener.pc_rollin = function(eventObj:Object) {
			_root.PC_Engine.setCursorStyle(ros, String(eventObj.cursorIndex));
			if (ov<>"null"){ et.gotoAndStop(ov)};
		};
		buttonListener.pc_mousedown = function(eventObj:Object) {
			if (dn<>"null"){ et.gotoAndStop(dn)};
		};
		buttonListener.pc_mouseup = function(eventObj:Object) {
			if (up<>"null"){ et.gotoAndStop(up)};
		};
		_parent.addEventListener("pc_rollover", buttonListener);
		_parent.addEventListener("pc_rollin", buttonListener);
		_parent.addEventListener("pc_rollout", buttonListener);
		_parent.addEventListener("pc_mousedown", buttonListener);
		_parent.addEventListener("pc_mouseup", buttonListener);
	}
}
