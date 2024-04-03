/*
	Initialise various framework components.

	The order of execution here is crucial, for example, if a link which opens in a popup window is hidden in a JavaScript specific comment,
	the comment needs converting into uncommented HTML before the PopupWindow injector searches for popup window links.
*/
Framework.JavaScriptContent.show();
Framework.PopupWindows.inject();
Framework.DisplayConditions.inject();
Framework.LinkBackLinks.setup();

// These are form element handlers
Framework.FormValidation.inject();
Framework.PersistentForms.inject();
Framework.DuplicateSubmitBlocker.inject();

// Input element handlers
Framework.BrowserBackButtonInvoker.inject();
Framework.BypassValidation.inject();

// Accessibility
Framework.Accessibility.inject();

/* 
	Put slow functions at the end of the script.
*/

// Anything waiting for the DOM to be ready can be called now.
Framework.Utility.domIsReady();
Framework.DeviceProfiling.init();
Framework.MDTPDeviceFingerPrinting.init();
