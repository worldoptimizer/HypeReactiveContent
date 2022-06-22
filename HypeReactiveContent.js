/*!
Hype Reactive Content 1.0.5
copyright (c) 2022 Max Ziebell, (https://maxziebell.de). MIT-license
*/
/*
* Version-History
* 1.0.0 Initial release under MIT-license
* 1.0.1 Refactored naming and release on GitHub
* 1.0.2 This version is being released to get JsDelivr to update
* 1.0.3 Changed listener syntax to sentence structure
* 1.0.4 Fixed falsy values not being updated
* 1.0.5 Added Hype Action Events support running code through triggerAction
*/
if("HypeReactiveContent" in window === false) window['HypeReactiveContent'] = (function () {
	/**
	  * @function enableReactiveObject
	  * @param {object} obj - the object to be made reactive.
	  * @param {function} callback - the function to be called when a property of the object is changed.
	  * @returns {object} - the reactive object.
	  */
	 function enableReactiveObject(obj, callback) {
		const handler = {
			get(target, key, receiver) {
				const result = Reflect.get(target, key, receiver);
				if (typeof result === 'object') {
					return enableReactiveObject(result, callback);
				}
				return result;
			},
			set(target, key, value, receiver) {
				const result = Reflect.set(target, key, value, receiver);				
				callback(key, value, target, receiver);
				return result;
			},
			has(target, key, receiver) {
				if (key=='hypeDocument') return false;
				if (!target.hasOwnProperty(key) && !window[key]) return true;
				return Reflect.has(target, key, receiver)
			},
		};
		const proxy = new Proxy(obj, handler);
		return proxy;
	}

	/**
	 * @function debounceByRequestFrame
	 * @param {function} fn - the function to be debounced
	 * @returns {function} - the debounced function
	 */
	function debounceByRequestFrame(fn) {
		return function() {
			if (fn.timeout) return;
			var args = arguments;
			fn.timeout = requestAnimationFrame(function() {
				fn.apply(this, args);
				fn.timeout = null;
			}.bind(this));
		};
	}
	
	/**
	 * @function runCode 
	 * This is used if there Hype Action Events isn't found
	 * @param {string} code JavaScript to run
	 * @param {HYPE.documents.API} hypeDocument for context
	 */
	function runCode(code, hypeDocument) {
		try {
			return new Function('hypeDocument', 'customData', 'with(customData){ ' + code + '}')(hypeDocument, hypeDocument.customData);
		} catch (e) {
			console.error(e)
		}
	}
	
	/**
	 * @function HypeDocumentLoad
	 * @param {object} hypeDocument - the hypeDocument
	 * @param {object} element - the element
	 * @param {object} event - the event
	 */
	function HypeDocumentLoad(hypeDocument, element, event) {
		
		hypeDocument.updateContent = function(key, value) {
			if (key!==undefined && value!==undefined) hypeDocument.triggerCustomBehaviorNamed(key + ' equals ' + (typeof value === 'string' ? '"' + value + '"' : value))
			if (key!==undefined) hypeDocument.triggerCustomBehaviorNamed(key + ' was updated')
			let sceneElm = document.getElementById(hypeDocument.currentSceneId());
			sceneElm.querySelectorAll('[data-content], [data-visibility]').forEach(function(elm){
				let content = elm.getAttribute('data-content');
				let visibility = elm.getAttribute('data-visibility');
				if ("HypeActionEvents" in window === false) {
					if (content) {
						let contentReturn = runCode('return '+content, hypeDocument);
						elm.innerHTML =  contentReturn!==undefined? contentReturn : '';
					}
					if (visibility) {
						let visibilityReturn = runCode('return '+visibility, hypeDocument);
						elm.style.visibility = visibilityReturn? 'visible': 'hidden';
					}
				} else {
					if (content) {
						let contentReturn = hypeDocument.triggerAction ('return '+content, { element: elm, event: {type:'HypeReactiveContent'}});
						elm.innerHTML = contentReturn!==undefined? contentReturn : '';
					}
					if (visibility) {
						let visibilityReturn = hypeDocument.triggerAction ('return '+visibility, { element: elm, event: {type:'HypeReactiveContent'}});
						elm.style.visibility = visibilityReturn? 'visible': 'hidden';
					}
				}
			})	
		}
		
		hypeDocument.customData = enableReactiveObject(hypeDocument.customData, debounceByRequestFrame(hypeDocument.updateContent));
		if (hypeDocument.functions().HypeReactiveContent) hypeDocument.functions().HypeReactiveContent(hypeDocument, element, event);
	}
	
	function HypeTriggerCustomBehavior(hypeDocument, element, event) {
		if ("HypeActionEvents" in window !== false) return;
		var code = event.customBehaviorName;
		if (/[;=()]/.test(code)) runCode(code, hypeDocument);
	}
	
	function HypeScenePrepareForDisplay(hypeDocument, element, event) {
		hypeDocument.updateContent()
	}

	if ("HYPE_eventListeners" in window === false) { window.HYPE_eventListeners = Array(); }
	window.HYPE_eventListeners.push({ "type": "HypeDocumentLoad", "callback": HypeDocumentLoad });
	window.HYPE_eventListeners.push({type: "HypeScenePrepareForDisplay", callback: HypeScenePrepareForDisplay});
	if ("HypeActionEvents" in window === false) {
		window.HYPE_eventListeners.push({ "type": "HypeTriggerCustomBehavior", "callback": HypeTriggerCustomBehavior });
	}
		
	return {
		version: '1.0.5'
	};
})();
