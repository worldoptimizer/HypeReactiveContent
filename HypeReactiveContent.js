
/*!
Hype Reactive Content 1.0.1
copyright (c) 2022 Max Ziebell, (https://maxziebell.de). MIT-license
*/
/*
* Version-History
* 1.0.0 Initial release under MIT-license
* 1.0.1 Refactored naming and release on GitHub
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
	 * @function HypeDocumentLoad
	 * @param {object} hypeDocument - the hypeDocument
	 * @param {object} element - the element
	 * @param {object} event - the event
	 */
	function HypeDocumentLoad(hypeDocument, element, event){
		hypeDocument.updateVars = function(key, value) {
			if (key && value) hypeDocument.triggerCustomBehaviorNamed(key + ' == ' + (typeof value === 'string' ? '"' + value + '"' : value))
			let sceneElm = document.getElementById(hypeDocument.currentSceneId());
			sceneElm.querySelectorAll('[data-content], [data-visibility]').forEach(function(elm){
				var content = elm.getAttribute('data-content');
				if (content) elm.innerHTML = hypeDocument.runCode(content, true) || '';
				var visibility = elm.getAttribute('data-visibility');
				if (visibility) elm.style.visibility = hypeDocument.runCode(visibility, true)? 'visible': 'hidden';
				
			})	
		}
		hypeDocument.runCode = function(code, ret){			
			try {
				if (ret) code = 'return '+code;
				return new Function('hypeDocument', 'customData', 'with(customData){ ' + code + '}')(hypeDocument, hypeDocument.customData);
			} catch (e) {
				console.error(e)
			}
		}
		hypeDocument.customData = enableReactiveObject(hypeDocument.customData, debounceByRequestFrame(hypeDocument.updateVars));
		if (hypeDocument.functions().HypeReactiveContent) hypeDocument.functions().HypeReactiveContent(hypeDocument, element, event);
	}
	
	function HypeTriggerCustomBehavior(hypeDocument, element, event) {
		var code = event.customBehaviorName;
		if (/[;=()]/.test(code)) hypeDocument.runCode(code);
	}
	
	function HypeScenePrepareForDisplay(hypeDocument, element, event) {
		hypeDocument.updateVars()
	}

	if ("HYPE_eventListeners" in window === false) { window.HYPE_eventListeners = Array(); }
	window.HYPE_eventListeners.push({ "type": "HypeDocumentLoad", "callback": HypeDocumentLoad });
	window.HYPE_eventListeners.push({ "type": "HypeTriggerCustomBehavior", "callback": HypeTriggerCustomBehavior });
	window.HYPE_eventListeners.push({type: "HypeScenePrepareForDisplay", callback: HypeScenePrepareForDisplay});
	
	return {
		version: '1.0.1'
	};
})();
