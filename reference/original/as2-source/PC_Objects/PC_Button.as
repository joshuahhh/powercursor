/****************************************************
* PowerCursor project, TU/e Industrial Design
* V1.0, July 2007, by Mensvoort/de Man
* 
*  PC_BUTTON
* 
* The PC_Button is a standard customizable button
* 
****************************************************/
	
class PC_Objects.PC_Button extends PC_Objects.PC_ReadyMadeObject {
	
	// Vars
	//--------------------------------------	
	private var graphics:MovieClip;
	private var visualisation:MovieClip;	
	
	private var __style:String;
	private var __rolloverCursorStyle:String;
	
	private var __buttonlistener:Object;
	

	// Inspectables
	//--------------------------------------

	
	// Store Click-Action
	[Inspectable(type="String", defaultValue="gotoAndPlay", name="onRelease Action")]
	private var __action:String;
	
	[Inspectable(type="String", defaultValue="1", name="onRelease Parameter")]
	private var __param:String;
	
	[Inspectable(type="String", defaultValue="this", name="onRelease Target")]
	private var __target:String;
	
	
	// Store Colors for didderent states
	[Inspectable(type="Color", defaultValue="#FF0000", name="normalColor")]
	private var __normalColor:Color;
	
	[Inspectable(type="Color", defaultValue="#FF0000", name="rolloverColor")]
	private var __rolloverColor:Color;
	
	[Inspectable(type="Color", defaultValue="#FF0000", name="downColor")]
	private var __downColor:Color;
	
	
	// Graphic styles of the cursor when rolling over button. 
	[Inspectable(type="String", enumeration="Finger,Default,Ball,GrabHand,Arrow", defaultValue="Finger", name="CursorStyle", category="Button")]
	 public function set rolloverCursorStyle(newRolloverCursorStyle:String):Void {
		__rolloverCursorStyle = newRolloverCursorStyle;
		 
	}
	public function get rolloverCursorStyle():String {
		return __rolloverCursorStyle;
	}

	// Tint is the colour of the object’s circle or disc.
	[Inspectable(type="String", enumeration="None,Basic Rectangle,Basic Rounded,Basic Circle,PowerCursor", defaultValue="PowerCursor", name="Graphics Style", category="Graphics")]
	public function set style(newStyle:String):Void {
		__style = newStyle;
		draw();
	}
	public function get style():String {
		return __style;
	}
	

	// Constructor
	//--------------------------------------
	function PC_Button( )	{		
	
		if ( __style != "PowerCursor" ) {
			var strColor = getColor( "pc_rollout" );	
			if ( strColor != -1 ) setColor( strColor );
		}
		
		createListener( );
	}


	// Init & Draw methods
	//--------------------------------------
	function init(Void):Void {
		
		// remove the 'preview' graphics that are visible in the authoring environment
		graphics._alpha = 0;
		
		super.init();
	}

	function draw( Void ):Void {
		
		// remove the old visualisation & shading
		this.visualisation.removeMovieClip( );

		// add a visualisation to this object		
		switch ( __style ) {
			case "Basic Rectangle":
				this.attachMovie( "PC_BtnBasicRectangle", "visualisation", this.getNextHighestDepth( ) );
				break;
			case "Basic Rounded":
				this.attachMovie( "PC_BtnBasicRounded", "visualisation", this.getNextHighestDepth( ) );
				break;
			case "Basic Circle":
				this.attachMovie( "PC_BtnBasicCircle", "visualisation", this.getNextHighestDepth( ) );
				break;
			case "PowerCursor":
				this.attachMovie( "PC_BtnPowerCursor", "visualisation", this.getNextHighestDepth( ) );
				break;
		}

		
		this.visualisation._width  = this.graphics._width;
		this.visualisation._height = this.graphics._height;
		
		super.draw();
			
	}
	
	 
	// Custom Methods
	//--------------------------------------
	
	private function setColor( objColor:Color ) {		
		var col = new Color( this.visualisation.mc_fill );
		col.setRGB( objColor );
	}
	
	private function getColor( strEvent:String ) {
		switch ( strEvent ) {
			case "pc_rollin": return __rolloverColor; break;
			case "pc_rollout": return __normalColor; break;
			case "pc_mousedown": return __downColor; break;
			case "pc_mouseup": return __rolloverColor; break;
		}
		
		return -1;
	}
	
	private function getAction( strEvent:String ) {
		if ( __action == "" || __action == undefined ) return -1;
		else return __action;
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
					case "this":
						break;
					default: 
						objTarget = objTarget[ arrTarget[ i ] ]; 
						break;
				}
			}
		}
		
		return objTarget;		
	}
	
	// This constructs the ButtonMaker's listener and 
	// attaches it to its parent.
	private function createListener() {		
		__buttonlistener = new Object( );		
		
		var eventtarget:MovieClip = eventTarget;
		var eventparameter:String = __param;
		var targetobject:String = __target;
		var rocursorstyle:String = __rolloverCursorStyle;		
		var btstyle = __style;

		__buttonlistener.pc_rollout = function( eventObj:Object ) {	
			_root.PC_Engine.setCursorStyle( "Default", String( eventObj.cursorIndex ));
			
			if ( btstyle == "PowerCursor" ) eventtarget.visualisation.gotoAndStop( "normal" );
			else {
				var strColor = eventtarget.getColor( "pc_rollout" );	
				if ( strColor != -1 ) eventtarget.setColor( strColor );
			}
		};
		
		__buttonlistener.pc_rollin = function( eventObj:Object ) {			
			_root.PC_Engine.setCursorStyle( rocursorstyle, String( eventObj.cursorIndex ) );
			
			if ( btstyle == "PowerCursor" ) eventtarget.visualisation.gotoAndStop( "rollover" );
			else {
				var strColor = eventtarget.getColor( "pc_rollin" );	
				if ( strColor != -1 ) eventtarget.setColor( strColor );
			}
		};
		
		__buttonlistener.pc_mousedown = function( eventObj:Object ) {
			if ( btstyle == "PowerCursor" ) eventtarget.visualisation.gotoAndStop( "down" );
			else {
				var strColor = eventtarget.getColor( "pc_mousedown" );	
				if ( strColor != -1 ) eventtarget.setColor( strColor );
			}
		};
		
		__buttonlistener.pc_mouseup = function( eventObj:Object ) {
			var objAction = eventtarget.getAction( );
			
			if ( objAction != -1 ) {
				var objTarget = eventtarget.getTarget( eventtarget, targetobject );				
				objTarget[ objAction ].call( objTarget, eventparameter );
			}
			
			if ( btstyle == "PowerCursor" ) eventtarget.visualisation.gotoAndStop( "normal" );
			else {
				var strColor = eventtarget.getColor( "pc_mouseup" );	
				if ( strColor != -1 ) eventtarget.setColor( strColor );
			}
		};
		
		this.addEventListener( "pc_rollin", __buttonlistener );
		this.addEventListener( "pc_rollout", __buttonlistener );
		this.addEventListener( "pc_mousedown", __buttonlistener );
		this.addEventListener( "pc_mouseup", __buttonlistener );
	}
}