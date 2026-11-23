/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, September 2006, by Mensvoort/Hendrix
* 
*  PC_OBJECT
* 
* The Object is a superclass of all ready-made and
* modifier objects in the PowerCursor toolkit, and 
* contains their common functionality: comparing 
* its area with the cursors (hit detection) and 
* event dispatching. The function to actually exert 
* a force on a cursor is virtual – it is
* implemented in the individual objects’ classes,
* as every object displaces cursors in a different 
* way, of course.
* 
****************************************************/

class PC_Objects.PC_Object extends mx.core.UIObject {
	
	[Event("pc_mouseup")]
	[Event("pc_mousedown")]
	[Event("pc_rollin")]
	[Event("pc_rollover")]
	[Event("pc_rollout")]

	function dispatchEvent() {};
	function addEventListener() {};
	function removeEventListener() {};


	private var cursorsInside:Array;
	
	private var hitTestTarget:MovieClip;
	private var eventTarget:MovieClip;
	private var __rolloverCursorStyle;
	private var __rolloverCursorSound;
	
	// Inspectables
	//--------------------------------------
	// Graphic styles of the cursor when rolling over button. 
	[Inspectable(type="String", enumeration="Null,Finger,Ball,Hand,GrabHand,Arrow,Default", defaultValue="Null", name="CursorStyle", category="Button")]
	public function set rolloverCursorStyle(newRolloverCursorStyle:String):Void {
		__rolloverCursorStyle = newRolloverCursorStyle;
	}
	public function get rolloverCursorStyle():String {
		return __rolloverCursorStyle;
	}
	
	// Sound of the cursor when rolling over button. 
	[Inspectable(type="String", name="CursorSound", category="Button")]
	public function set rolloverCursorSound(newRolloverCursorSound:String):Void {
		__rolloverCursorSound = newRolloverCursorSound;
	}
	public function get rolloverCursorSound():String {
		return __rolloverCursorSound;
	}

	// Constructor
	//--------------------------------------
	function PC_Object()	{

		cursorsInside = new Array();

		this.onEnterFrame = function() {
			heartbeat();
		};
		
		this.onMouseDown = function() {
			hitTestToEvent("pc_mousedown");
		};
		
		this.onMouseUp = function() {
			hitTestToEvent("pc_mouseup");
		};

	}

	// Init & Draw methods
	//--------------------------------------
	function init(Void):Void {

		this.onLoad = function() {
			if (_root.PC_Engine.hideAllObjects) {
				_parent._alpha = 0;
			}
		}
		
		super.init();
	}


	// Custom Methods
	//--------------------------------------
	
	function heartbeat() {
		
		var e:MovieClip = _root.PC_Engine;
		
		var hitCount:Number = 0;
		
		// Check every cursor known to the engine
		for (var i=0; i < e.getCursorCount(); i++) {
		
			var cur:PC_Cursors.PC_Cursor = e.getCursor(i);
				
			var cursorx = cur.xPosition;
			var cursory = cur.yPosition;
			
			if (hitTestTarget.hitTest(cursorx, cursory, true) ) {
				
				// calculate pointer's position relative to object
				var point:Object = {x:cursorx, y:cursory};
				globalToLocal(point);
				
				// let this object apply its force
				applyForce(i, point.x, point.y, cursorx, cursory);

				if (cursorsInside[i] == false) {
					e.dispatchPCEvent(i, eventTarget, "pc_rollin");
					
					if (__rolloverCursorStyle<>"null") { e.getCursor(i).setCursorStyle( __rolloverCursorStyle);}
					if (__rolloverCursorSound<>"null") { e.getCursor(i).setCursorSound( __rolloverCursorSound, this );}
				}
				
				e.dispatchPCEvent(i, eventTarget, "pc_rollover");
				
				cursorsInside[i] = true;
			
			} else {

				if (cursorsInside[i] == true) {
					e.dispatchPCEvent(i, eventTarget, "pc_rollout");
						if (__rolloverCursorStyle<>"null") { e.getCursor(i).setCursorStyle("Arrow") };
						if (__rolloverCursorSound<>"null") { e.getCursor(i).setCursorSound("Null", this ) };

				}

				cursorsInside[i] = false;

			}
				
		}
	}
	
	

	private function hitTestToEvent(eventName:String) {
		
		var e:MovieClip = _root.PC_Engine;
		var hitCount:Number = 0;
		
		for (var i=0; i < e.getCursorCount(); i++) {
			
			var cur:PC_Cursors.PC_Cursor = e.getCursor(i);
			if (hitTestTarget.hitTest(cur.xPosition, cur.yPosition, true)) {
				e.dispatchPCEvent(i, eventTarget, eventName);
			}
		}
	}


	private function totalRotation(target_mc:MovieClip):Number {
		
		var mc:MovieClip = target_mc;
		var rot:Number = 0;
		
		while (mc != undefined) {
			
			rot += mc._rotation;
			mc = mc._parent;
			
		}
		
		return rot;
		
	}

	
	//
	// Virtual Function!
	//
	function applyForce(i:Number, relx:Number, rely:Number, globalx:Number, globaly:Number):Void {
	}
	
}