/*!
Hype Reactive Content 1.1.2
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
* 1.0.6 Added Hype Data Magic support, disable with HypeDataMagic.setDefault('refreshOnCustomData', false)
*       Added and exposed HypeReactiveContent.disableReactiveObject, Exposed HypeReactiveContent.enableReactiveObject
*       Improved runCode running in hypeDocument scope while still accessing customData
* 1.0.7 Fixed small regression in the runCode enclosure for has probes
* 1.0.8 Visibility changes switch display none to block if needed, debounced HypeTriggerCustomBehavior
*       Added compatibility with Hype Global Behavior
* 1.0.9 Added isCode and setting a function in customData will not trigger and 'equals' behavior anymore
		Added setDefault and getDefault, added customDataUpdate (callback) as default possibility
* 1.1.0 Added hypeDocument.enableReactiveCustomData and the default customData
* 1.1.1 Fixed null case and added reactive highlighting in IDE
*       Added data-scope and scope indicator at beginning of expressions with the arrow symbol (⇢)
*       Added the ability to inline the scope in data-content before the arrow symbol (⇢)
* 1.1.2 Minor cleanups and fixes
*/
if("HypeReactiveContent" in window === false) window['HypeReactiveContent'] = (function () {

	/* @const */
	const _isHypeIDE = window.location.href.indexOf("/Hype/Scratch/HypeScratch.") != -1;

	_default = {
		highlightReactiveContent: true,
		highlightVisibilityData: true,
		highlightVisibilityArea: true,
		highlightContentData: true,
		highlightScopeData: true,
		scopeSymbol: '⇢',
		scopeSymbolLength: 1,
		visibilitySymbol: '👁',
	}

	/**
	 * This function allows to override a global default by key or if a object is given as key to override all default at once
	 *
	 * @param {String} key This is the key to override
	 * @param {String|Function|Object} value This is the value to set for the key
	 */
	 function setDefault(key, value){
		//allow setting all defaults
		if (typeof(key) == 'object') {
			_default = key;
			return;
		}
	
		//set specific default
		_default[key] = value;
	}
	
	/**
	 * This function returns the value of a default by key or all default if no key is given
	 *
	 * @param {String} key This the key of the default.
	 * @return Returns the current value for a default with a certain key.
	 */
	function getDefault(key){
		// return all defaults if no key is given
		if (!key) return _default;
	
		// return specific default
		return _default[key];
	}


	/**
	 * Helper to determine if an object is reactive by checking __isReactive.
	 *
	 * @param {Object} obj - The object to check.
	 * @returns {boolean} - True if the object is reactive, false otherwise.
	 */
	let isProxy = Symbol("isProxy")
	 
	function isReactive(obj) {
		return obj[isProxy];
	};
	
	/**
	 * This function makes an object reactive and fires a callback on set operations
	 *
	 * @param {Object} obj This the object that should be made reactive
	 * @param {Function} callback This is function that should be called
	 * @return Returns the object as a proxy
	 */
	function enableReactiveObject(obj, callback) {
		if (obj == null || isReactive(obj)) return obj;
		const handler = {
			get: function(target, key, receiver) {
				if (key === isProxy) return true;
				const result = Reflect.get(target, key, receiver);
				if (typeof result === 'object') {
					return enableReactiveObject(result, callback);
				}
				return result;
			},
			set: function(target, key, value, receiver) {
				const result = Reflect.set(target, key, value, receiver);
				callback(key, value, target, receiver);
				return result;
			}
		}
		const proxy = new Proxy(obj, handler);
		return proxy;
	}
	
	/**
	 * This function makes an object non-reactive
	 *
	 * @param {Object} obj This the object that should be made non-reactive
	 * @return Returns the object as a non-reactive object
	 */
	function disableReactiveObject(obj) {
		if (!isReactive(obj)) return obj;
	
		const result = {};
		for (const key in obj) {
			if (obj.hasOwnProperty(key)) {
				const value = obj[key];
				if (typeof value === 'object') {
					result[key] = disableReactiveObject(value);
				} else {
					result[key] = value;
				}
			}
		}
		return result;
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
	function runCode(code, hypeDocument, scope, HypeActionEventOptions) {
		if (scope){
			if (typeof scope !== 'object') return null;
		} else {
			scope = hypeDocument.customData;
		}
		
		if ("HypeActionEvents" in window !== false) {
			HypeActionEventOptions = HypeActionEventOptions || {};		
			return hypeDocument.triggerAction (code, { 
				element: HypeActionEventOptions.element, 
				event: { type: HypeActionEventOptions.type},
				scope: scope,
			});
			
		} else {
			
			
			try {
				let $context = new Proxy(Object.assign({}, hypeDocument), {
					set (target, key, val, receiver) {
						if (!Reflect.get(target, key, receiver)) return Reflect.set(scope, key, val);
						return Reflect.set(target, key, val, receiver);
					},
					get(target, key, receiver) {
						var value = Reflect.get(target, key, receiver);
						if (value) return value;
						return Reflect.get(scope, key);
					},
					has(target, key, receiver) {
						if (!target.hasOwnProperty(key) && !window[key]) return true;
						return Reflect.has(target, key, receiver)
					},
				});
				return new Function('$context', 'with($context){ ' + code + '}')($context);
			} catch (e) {
				console.error(e)
			}	
		}
	}
	
	function isCode(code){
		return /[;=()]/.test(code);
	}
	
	function resolveScope(hypeDocument, element, scope) {
		if (scope) {
			return runCode('return '+scope, hypeDocument, null, {
				element: element, 
				type: 'HypeReactiveScope',
			});
		}
		return null;
	}

	function resolveClosestScope(hypeDocument, element) {
		let closestElm = element.closest('[data-scope]');
		if (closestElm) return resolveScope(hypeDocument, element, closestElm.getAttribute('data-scope'));
		return null;
	}
	
	/**
	 * @function HypeDocumentLoad
	 * @param {object} hypeDocument - the hypeDocument
	 * @param {object} element - the element
	 * @param {object} event - the event
	 */
	function HypeDocumentLoad(hypeDocument, element, event) {
		
		hypeDocument.refreshReactiveContent = function(key, value, target, receiver) {
			if (key!==undefined && value!==undefined && !isCode(value)) {
				hypeDocument.triggerCustomBehaviorNamed(key + ' equals ' + (typeof value === 'string' ? '"' + value + '"' : value));
			}
			
			if (key!==undefined) {
				if (getDefault('customDataUpdate')) getDefault('customDataUpdate')(key, value, target, receiver);
				hypeDocument.triggerCustomBehaviorNamed('customData was changed');
				hypeDocument.triggerCustomBehaviorNamed(key + ' was updated');
			}
			
			let sceneElm = document.getElementById(hypeDocument.currentSceneId());
			
			sceneElm.querySelectorAll('[data-content], [data-visibility]').forEach(function(elm){
				let content = elm.getAttribute('data-content');
				let visibility = elm.getAttribute('data-visibility');
				let scopeContent = null;
				let scopeVisibility = null;
				let scopeSymbolLength = getDefault('scopeSymbolLength');
				
				if (content) {
					content = content.trim();
					if (content.startsWith(getDefault('scopeSymbol'))) {
						content = content.slice(scopeSymbolLength);
						scopeContent = resolveClosestScope(hypeDocument, elm);
					} else if (content.includes(getDefault('scopeSymbol'))) {
						scopeContent = content.slice(0, content.indexOf(getDefault('scopeSymbol')));
						scopeContent = resolveScope(hypeDocument, elm, scopeContent);
						content = content.slice(content.indexOf(getDefault('scopeSymbol')) + scopeSymbolLength);
					}
					let contentReturn = runCode('return '+content, hypeDocument, scopeContent, {
						element: elm, 
						type: 'HypeReactiveContent',
					});
					elm.innerHTML =  contentReturn!==undefined? contentReturn : '';
				}
				
				if (visibility) {
					visibility = visibility.trim();
					if (visibility.startsWith(getDefault('scopeSymbol'))) {
						visibility = visibility.slice(scopeSymbolLength);
						scopeVisibility = scopeContent;
					} else if (visibility.includes(getDefault('scopeSymbol'))) {
						scopeVisibility = visibility.slice(0, visibility.indexOf(getDefault('scopeSymbol')));
						scopeVisibility = resolveScope(hypeDocument, elm, scopeVisibility)
						visibility = visibility.slice(visibility.indexOf(getDefault('scopeSymbol')) + scopeSymbolLength);
					}
					let visibilityReturn = runCode('return '+visibility, hypeDocument, scopeVisibility, {
						element: elm, 
						type: 'HypeReactiveVisibility',
					});
					if (elm.style.display == 'none') elm.style.display = 'block';
					elm.style.visibility = visibilityReturn? 'visible': 'hidden';
				}
			
			})
			
			if ("HypeDataMagic" in window !== false) {
				if (HypeDataMagic.getDefault('refreshOnCustomData')) hypeDocument.refresh();
			}	
		}
		hypeDocument.refreshReactiveContentDebounced = debounceByRequestFrame(hypeDocument.refreshReactiveContent);
		
		hypeDocument.enableReactiveCustomData = function(data){
			hypeDocument.customData = Object.assign(hypeDocument.customData, data || {});
			hypeDocument.customData = enableReactiveObject(hypeDocument.customData, hypeDocument.refreshReactiveContentDebounced);	
		}
		
		hypeDocument.enableReactiveCustomData(getDefault('customData') || {})
		
		if (hypeDocument.functions().HypeReactiveContent) hypeDocument.functions().HypeReactiveContent(hypeDocument, element, event);
	}
	
	function HypeTriggerCustomBehavior(hypeDocument, element, event) {
		if ("HypeActionEvents" in window !== false) return;
		var code = event.customBehaviorName;
		if (code.charAt(0) == '#') return;
		if (isCode(code)) runCode(code, hypeDocument);
	}
	
	function HypeScenePrepareForDisplay(hypeDocument, element, event) {
		hypeDocument.refreshReactiveContentDebounced();
	}

	if ("HYPE_eventListeners" in window === false) { window.HYPE_eventListeners = Array(); }
	window.HYPE_eventListeners.push({ "type": "HypeDocumentLoad", "callback": HypeDocumentLoad });
	window.HYPE_eventListeners.push({type: "HypeScenePrepareForDisplay", callback: HypeScenePrepareForDisplay});
	if ("HypeActionEvents" in window === false) {
		window.HYPE_eventListeners.push({ "type": "HypeTriggerCustomBehavior", "callback": HypeTriggerCustomBehavior });
	}
	
	if(_isHypeIDE){
		window.addEventListener("DOMContentLoaded", function(event) {
			if (getDefault('highlightReactiveContent')){
				
				let labelBase = "font-family:Helvetica,Arial;line-height:11px;font-size:9px;font-weight:normal;padding:2px 5px;white-space:nowrap;max-height:16px;color:#000;text-align:center;background-color:var(--color);";
				let labelTop = "position:absolute;top:-15px;left:-1px;border-top-right-radius:.2rem;border-top-left-radius:.2rem;";
				let labelBottom = "position:absolute;bottom:-15px;left:-1px;border-bottom-right-radius:.2rem;border-bottom-left-radius:.2rem"
				let colorScoped = '#ffcccc';
				let colorContent = '#f8d54f';
				let rules = [];
				
				if (getDefault('highlightContentData')) rules = rules.concat([
					"[data-content*='"+getDefault('scopeSymbol')+"']{--color:"+colorScoped+";}",
					"[data-content]{--color:#f8d54f;outline:1px solid "+colorContent+";position:relative}",
					"[data-content]::before{content:attr(data-content);"+labelBase+labelTop+"}",
				]);
					
				if (getDefault('highlightVisibilityData')) rules = rules.concat([	
					"[data-visibility*='"+getDefault('scopeSymbol')+"']{--color:"+colorScoped+";}",
					"[data-visibility]{--color:"+colorContent+";}",
					"[data-visibility]::before{content:'"+getDefault('visibilitySymbol')+" ' attr(data-visibility);"+labelBase+labelTop+"}",
				]);
					
				if (getDefault('highlightScopeData')) rules = rules.concat([	
					"[data-scope]{--color:"+colorScoped+"; outline:1px dashed var(--color);}",				
					"[data-scope]::before{content:attr(data-scope);"+labelBase+labelBottom+"}",
				]);
				
				if (getDefault('highlightContentData') && getDefault('highlightVisibilityData')) rules = rules.concat([	
					"[data-content][data-visibility]::before{content: attr(data-content) ' "+getDefault('visibilitySymbol')+" ' attr(data-visibility)}",
				]);
				
				if (getDefault('highlightVisibilityArea')) rules = rules.concat([	
					"[data-visibility]::after {content:'';position: absolute;top: 0;left: 0;width: 100%;height: 100%;background-image:repeating-linear-gradient(45deg,transparent,transparent 10px,var(--color) 10px,var(--color) 20px);opacity: .1;}",
				]);
					
				rules.forEach((rule)=> document.styleSheets[0].insertRule(rule,0));
			}
		});
	}
	
	return {
		version: '1.1.2',
		setDefault: setDefault,
		getDefault: getDefault,
		enableReactiveObject: enableReactiveObject,
		disableReactiveObject: disableReactiveObject,
		debounceByRequestFrame: debounceByRequestFrame,
	};
})();
