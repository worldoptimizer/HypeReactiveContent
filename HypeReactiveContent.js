/*!
Hype Reactive Content 1.4.0
copyright (c) 2024 Max Ziebell, (https://maxziebell.de). MIT-license
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
*       Added setDefault and getDefault, added customDataUpdate (callback) as default possibility
* 1.1.0 Added hypeDocument.enableReactiveCustomData and the default customData
* 1.1.1 Fixed null case and added reactive highlighting in IDE
*       Added data-scope and scope indicator at beginning of expressions with the arrow symbol (⇢)
*       Added the ability to inline the scope in data-content before the arrow symbol (⇢)
* 1.1.2 Minor cleanups and fixes
* 1.1.3 Fixed another falsy type bug that forwarded undefined data-scopes to the default scope
* 1.1.4 Added support for arbitrary scopeSymbols with arbitrary length, default is still ⇢
* 1.1.5 Added the _key getter in the proxy to return a simple object string path
*       This fixes custom behavior notifications for nested keys as a full pseudo key is returned
* 1.1.6 Added bubble type listener for action and behavior as data-content-changed-action, 
*       data-content-changed-behavior, data-visibility-changed-action and data-visibility-changed-behavior.
*       Added $elm and element to code execution even if not used in conjunction with Hype Action Events
* 1.1.7 Exposed resolveClosestScope to hypeDocument
* 1.1.8 Updated visibility handling in conjunction with scope in content processing
* 1.1.9 Added processValueInScope to streamline the code 
*       Added data-effect to trigger code on reactive content changes
*       Fixed a slight regression in the visibility handling
*       Reworked the IDE highlighting to be more robust and include effect
* 1.2.0 Fixed minor regressions in highlighting in the IDE
* 1.2.1 Added hypeDocument.customDataUpdate on Hype document basis
*       Fixed minor misses in the IDE highlighting for effect
* 1.2.2 Tweaked color highlighting in the IDE to color unscoped items in scopes correctly
* 1.3.0 Added WeakMap setter for hypeDocument.customData to automatically apply reactivity on reassignments
* 1.4.0 Added support for templates and variables using data-content-template and {{variable}} syntax
*       Added new functions: setContentTemplateByName, setContentTemplates, flushContentTemplateByName, flushContentTemplates        
*       Added visibility modes: auto (new default), manual and none
*       Added better error handling in runCode when in preview mode
*/

if ("HypeReactiveContent" in window === false) window['HypeReactiveContent'] = (function () {

	/* @const */ 
	const _isHypeIDE = window.location.href.indexOf("/Hype/Scratch/HypeScratch.") != -1;
	const customDataMap = new WeakMap();

	let _default = {
		scopeSymbol: '⇢',
		visibilitySymbol: '👁️',
		effectSymbol: '⚡️',
        templateSymbol: '📝',
		debounceCustomDataUpdate: true,
        visibilityMode: 'auto',
		debug: false,
	}
	
	if (_isHypeIDE) {
		_default = Object.assign(_default, {
			highlightReactiveContent: true,
			highlightVisibilityData: true,
			highlightVisibilityArea: true,
			highlightActionData: true,
			highlightScopeData: true,
            highlightTemplateData: true,
		})
	}

	/**
	 * This function is determins if we in a Hype Preview. 
	 *
	 * @return {Bolean} Return true if not on device
	 */
	function isHypePreview(){
		return window.location.href.indexOf("127.0.0.1:") != -1 &&
			window.location.href.indexOf("/preview/") != -1;
	}

	/**
	 * This function allows to override a global default by key or if a object is given as key to override all default at once
	 *
	 * @param {String} key This is the key to override
	 * @param {String|Function|Object} value This is the value to set for the key
	 */
	function setDefault(key, value) {
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
	function getDefault(key) {
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
	}
	
	function fullKey(_key, key) {
		return _key ? _key + '.' + key : key;
	}
	
	/**
	 * This function makes an object reactive and fires a callback on set operations
	 *
	 * @param {Object} obj This the object that should be made reactive
	 * @param {Function} callback This is function that should be called
	 * @return Returns the object as a proxy
	 */
	function enableReactiveObject(obj, callback, _key) {
		_key = _key || '';
		if (obj == null || isReactive(obj)) return obj;
		const handler = {
			get: function(target, key, receiver) {
				if (key === '_key') return _key;
				if (key === isProxy) return true;
				const result = Reflect.get(target, key, receiver);
				if (typeof result === 'object') {
					return enableReactiveObject(result, callback, fullKey(_key, key));
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
	function runCode(code, hypeDocument, scope, options) {
		if (scope) {
			if (typeof scope !== 'object') return null;
		} else {
			if (scope === undefined) return null;
			scope = hypeDocument.customData;
		}
		
		options = options || {};
		
		if ("HypeActionEvents" in window !== false) {
			return hypeDocument.triggerAction(code, { 
				element: options.element, 
				event: { type: options.type},
				scope: scope,
			});
			
		} else {
		
			try {
				let $context = new Proxy(Object.assign({
					element: options.element,
					$elm: options.element,
				}, hypeDocument), {
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
				if (getDefault('debug') || isHypePreview()) {
					console.error(
						"%c" + (options.errorMsg || 'HypeReactiveContent Error') +
						"%c" + (options.errorMsg ? '' : ' version ' + HypeReactiveContent.version) + "\n\n" +
						"%c" + code +
						(!options.omitError ? "%c" + "\n\n" + e + "\n\n" : ''),
						"font-size:12px; font-weight:bold",
						"font-size:8px",
						"min-height:40px;display: inline-block; padding: 10px; background-color: rgba(255,255,255,0.25); border: 1px solid lightgray; border-radius: 4px; font-family:Monospace; font-size:12px",
						"font-size:11px",
						options.element ? options.element : ''
					);
				} else {
					console.error(e);
				}
			} 
		}
	}
	
	function isCode(code) {
		return /[;=()]/.test(code);
	}
	
	function resolveScope(hypeDocument, element, scope) {
		if (scope) {
			return runCode('return ' + scope, hypeDocument, null, {
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

	function processValueInScope(value, hypeDocument, elm) {
		const scopeSymbol = getDefault('scopeSymbol');
		const scopeSymbolLength = scopeSymbol.length;
		let scope = null;

		value = value.trim();

		if (value.startsWith(scopeSymbol)) {
			value = value.slice(scopeSymbolLength);
			scope = resolveClosestScope(hypeDocument, elm);
		} else if (value.includes(scopeSymbol)) {
			scope = value.slice(0, value.indexOf(scopeSymbol));
			scope = resolveScope(hypeDocument, elm, scope);
			value = value.slice(value.indexOf(scopeSymbol) + scopeSymbolLength);
		}

		return {
			value: value,
			scope: scope
		};
	}

	/** 
     * Helper to parse templates using runCode for evaluation
     * 
     * @param {string} template - the template to parse
     * @param {HYPE.documents.API} hypeDocument - the hypeDocument
     * @param {HTMLElement} elm - the element
     * @returns {string} - the parsed template
     */
    function parseTemplate(template, hypeDocument, elm) {
        return template.replace(/{{\s*([^{}\s]+)\s*}}/g, function (match, expression) {
            const processed = processValueInScope(expression, hypeDocument, elm);
            let result = runCode('return ' + processed.value, hypeDocument, processed.scope, {
                element: elm,
                type: 'HypeReactiveTemplate',
            });
            return result !== undefined ? result : '';
        });
    }
    

    /*
     * Template Cache
     * @const {WeakMap} templateCache - the template cache
    */
	const templateCache = new WeakMap();

    /**
     * @function initTemplates
     * @param {HYPE.documents.API} hypeDocument - the hypeDocument
     * @returns {Map} - the document templates
     */
    function initTemplates(hypeDocument) {
        let sceneElm = document.getElementById(hypeDocument.currentSceneId());
        let documentTemplates = templateCache.get(hypeDocument) || new Map();
        
        sceneElm.querySelectorAll('[data-content-template]').forEach(function (elm) {
            const templateName = elm.getAttribute('data-content-template');
            const templateContent = elm.innerHTML;
    
            if (templateName && !documentTemplates.has(templateName)) {
                documentTemplates.set(templateName, templateContent);
            } else if (!templateName && !documentTemplates.has(elm)) {
                documentTemplates.set(elm, templateContent);
            }
        });
    
        templateCache.set(hypeDocument, documentTemplates);
    }
    

	/**
	 * @function setupCustomDataProxy
	 * @param {HYPE.documents.API} hypeDocument - the hypeDocument
	 */
	function setupCustomDataProxy(hypeDocument) {
		let currentCustomData = hypeDocument.customData || {};
		customDataMap.set(hypeDocument, currentCustomData);
	
		Object.defineProperty(hypeDocument, 'customData', {
			get: function() {
				return customDataMap.get(hypeDocument);
			},
			set: function(newValue) {
				const reactiveData = enableReactiveObject(newValue, hypeDocument.refreshReactiveContentDebounced);
				customDataMap.set(hypeDocument, reactiveData);
				if(getDefault('debounceCustomDataUpdate')) {
					hypeDocument.refreshReactiveContentDebounced();
				} else {
					hypeDocument.refreshReactiveContent();
				}
			}
		});
	}

	/**
	 * @function HypeDocumentLoad
	 * @param {object} hypeDocument - the hypeDocument
	 * @param {object} element - the element
	 * @param {object} event - the event
	 */
	function HypeDocumentLoad(hypeDocument, element, event) {
		
		let behaviorCallbacks = {}
		function behaviorActionHelper(elm, type, datasetKey, action, behavior) {
			let bubbleElm = elm.closest('[' + datasetKey + '-action]');
			if (bubbleElm) {
				runCode(bubbleElm.getAttribute(datasetKey + '-action'), hypeDocument, null, {
					element: elm, 
					type: type,
				})
			}
			bubbleElm = elm.closest('[' + datasetKey + '-behavior]');
			if (bubbleElm && !behaviorCallbacks[bubbleElm.id]) {
				behaviorCallbacks[bubbleElm.id] = true;
				let behavior = bubbleElm.getAttribute(datasetKey + '-behavior');
				debounceByRequestFrame(function () {
					hypeDocument.triggerCustomBehaviorNamed(behavior);
				})();
			}
		}
		
		hypeDocument.refreshReactiveContent = function (key, value, target, receiver) {
            if (key !== undefined && value !== undefined && !isCode(value)) {
                hypeDocument.triggerCustomBehaviorNamed(fullKey(receiver._key, key) + ' equals ' + (typeof value === 'string' ? '"' + value + '"' : value));
            }
        
            if (key !== undefined) {
                if (getDefault('customDataUpdate')) getDefault('customDataUpdate')(key, value, target, receiver);
                if (hypeDocument.customDataUpdate) hypeDocument.customDataUpdate(key, value, target, receiver);
                hypeDocument.triggerCustomBehaviorNamed('customData was changed');
                hypeDocument.triggerCustomBehaviorNamed(fullKey(receiver._key, key) + ' was updated');
            }
        
            let sceneElm = document.getElementById(hypeDocument.currentSceneId());
            behaviorCallbacks = {};
        
            sceneElm.querySelectorAll('[data-visibility], [data-content], [data-effect], [data-content-template]').forEach(function (elm) {
                let content = elm.getAttribute('data-content');
                let visibility = elm.getAttribute('data-visibility');
                let effect = elm.getAttribute('data-effect');
                let hasTemplate = elm.hasAttribute('data-content-template');
        
                if (visibility) {
                    const processed = processValueInScope(visibility, hypeDocument, elm);
                    let result = runCode('return ' + processed.value, hypeDocument, processed.scope, {
                        element: elm,
                        type: 'HypeReactiveVisibility',
                    });
        
                    if (elm.style.display == 'none') elm.style.display = 'block';
                    let newVisibility = result ? 'visible' : 'hidden';
                    if (newVisibility !== elm.style.visibility) {
                        elm.style.visibility = newVisibility;
                        if (key) behaviorActionHelper(elm, 'HypeReactiveVisibilityChanged', 'data-visibility-changed', true, true);
                    }
                }
        
                if (effect) {
                    const processed = processValueInScope(effect, hypeDocument, elm);
                    runCode(processed.value, hypeDocument, processed.scope, {
                        element: elm,
                        type: 'HypeReactiveEffect',
                    });
                }
        
                if (content) {
                    const processed = processValueInScope(content, hypeDocument, elm);
                    let result = runCode('return ' + processed.value, hypeDocument, processed.scope, {
                        element: elm,
                        type: 'HypeReactiveContent',
                    });
        
                    result = result !== undefined ? result : '';
                    if (result !== elm.innerHTML) {
                        elm.innerHTML = result;
                        if (key) behaviorActionHelper(elm, 'HypeReactiveContentChanged', 'data-content-changed', true, true);
                    }
                } else if (hasTemplate) {
                    let templateName = elm.getAttribute('data-content-template');
                    const documentTemplates = templateCache.get(hypeDocument) || new Map();
                    let templateContent = templateName ? documentTemplates.get(templateName) : documentTemplates.get(elm);
        
                    if (templateContent) {
                        const renderedTemplate = parseTemplate(templateContent, hypeDocument, elm);
                        if (renderedTemplate !== elm.innerHTML) {
                            elm.innerHTML = renderedTemplate;
                            if (key) behaviorActionHelper(elm, 'HypeReactiveTemplateChanged', 'data-content-template-changed', true, true);
                        }
                    } else {
                        elm.innerHTML = '';
                    }
                }
            });
        
            if ("HypeDataMagic" in window !== false) {
                if (HypeDataMagic.getDefault('refreshOnCustomData')) hypeDocument.refresh();
            }
        }        
        

		hypeDocument.refreshReactiveContentDebounced = debounceByRequestFrame(hypeDocument.refreshReactiveContent);
		
		hypeDocument.resolveClosestScope = function (elm) {
			return resolveClosestScope(hypeDocument, elm);
		}
		
		hypeDocument.enableReactiveCustomData = function (data) {
			const existingData = customDataMap.get(hypeDocument) || {};
			hypeDocument.customData = Object.assign(existingData, data || {});
		}

        hypeDocument.setContentTemplateByName = function(templateName, templateContent, forceRefresh = true) {
            let documentTemplates = templateCache.get(hypeDocument) || new Map();
            documentTemplates.set(templateName, templateContent);
            templateCache.set(hypeDocument, documentTemplates);
            if (forceRefresh) hypeDocument.refreshReactiveContentDebounced();
        }
        
        hypeDocument.setContentTemplates = function(templates, forceRefresh = true) {
            if (templates && typeof templates === 'object') {
                for (let templateName in templates) {
                    if (templates.hasOwnProperty(templateName)) {
                        hypeDocument.setContentTemplateByName(templateName, templates[templateName], false);
                    }
                }
                if (forceRefresh) hypeDocument.refreshReactiveContentDebounced();
            }
        }
        
        hypeDocument.flushContentTemplateByName = function(templateName, forceRefresh = true) {
            const documentTemplates = templateCache.get(hypeDocument);
            if (documentTemplates && templateName) {
                documentTemplates.delete(templateName);
                templateCache.set(hypeDocument, documentTemplates);
                if (forceRefresh) hypeDocument.refreshReactiveContentDebounced();
            }
        }
        
        hypeDocument.flushContentTemplates = function(forceRefresh = true) {
            const documentTemplates = templateCache.get(hypeDocument);
            if (documentTemplates) {
                documentTemplates.clear();
                templateCache.set(hypeDocument, documentTemplates);
                if (forceRefresh) hypeDocument.refreshReactiveContentDebounced();
            }
        }        

		setupCustomDataProxy(hypeDocument);

		hypeDocument.enableReactiveCustomData(getDefault('customData') || {});

		if (hypeDocument.functions().HypeReactiveContent) hypeDocument.functions().HypeReactiveContent(hypeDocument, element, event);
	}
	
	function HypeTriggerCustomBehavior(hypeDocument, element, event) {
		if ("HypeActionEvents" in window !== false) return;
		var code = event.customBehaviorName;
		if (code.charAt(0) == '#') return;
		if (isCode(code)) runCode(code, hypeDocument, hypeDocument.customData);
	}
	
	function HypeScenePrepareForDisplay(hypeDocument, element, event) {
		initTemplates(hypeDocument);
        hypeDocument.refreshReactiveContentDebounced();
	}

	if ("HYPE_eventListeners" in window === false) { window.HYPE_eventListeners = Array(); }
	window.HYPE_eventListeners.push({ "type": "HypeDocumentLoad", "callback": HypeDocumentLoad });
	window.HYPE_eventListeners.push({ type: "HypeScenePrepareForDisplay", callback: HypeScenePrepareForDisplay });
	
    if ("HypeActionEvents" in window === false) {
		window.HYPE_eventListeners.push({ "type": "HypeTriggerCustomBehavior", "callback": HypeTriggerCustomBehavior });
	}
	
	if (_isHypeIDE) {
		window.addEventListener("DOMContentLoaded", function (event) {
			if (getDefault('highlightReactiveContent')) {

				let labelBase = "font-family:Helvetica,Arial;line-height:11px;font-size:9px;font-weight:normal;padding:2px 5px;white-space:nowrap;max-height:16px;color:#000;text-align:center;background-color:var(--data-reactive-color);";
				let labelTop = "position:absolute;top:-15px;left:-1px;border-top-right-radius:.2rem;border-top-left-radius:.2rem;";
				let labelBottom = "position:absolute;bottom:-15px;left:-1px;border-bottom-right-radius:.2rem;border-bottom-left-radius:.2rem"
				let colorScoped = '#ffcccc';
				let colorContent = '#f8d54f';
				let rules = [
					"[data-scope] [data-content*=" + getDefault('scopeSymbol') + "],"+
					"[data-scope] [data-effect*=" + getDefault('scopeSymbol') + "],"+
					"[data-scope] [data-visibility*=" + getDefault('scopeSymbol') + "]"+
					"{--data-reactive-color: " + colorScoped + "}",
					
					"[data-content], [data-effect], [data-visibility], [data-content-template]"+
					"{--data-reactive-color: " + colorContent + "}"
				];
			
				document.documentElement.style.setProperty('--data-reactive-color', colorContent);

				if (getDefault('highlightActionData')) rules = rules.concat([
					"[data-content]{outline:1px dashed var(--data-reactive-color);position:relative}",
					"[data-content]::before{content:attr(data-content);" + labelBase + labelTop + "}",
					"[data-effect]::before{content:'" + getDefault('effectSymbol') + " ' attr(data-effect);" + labelBase + labelTop + "}",
					"[data-content][data-effect]::before{content: attr(data-content) ' " + getDefault('effectSymbol') + " ' attr(data-effect)}",
				]);

                if (getDefault('highlightTemplateData')) rules = rules.concat([ 
                    "[data-content-template]{outline:1px dashed var(--data-reactive-color);position:relative}",
                    "[data-content-template]::before{content:'" + getDefault('templateSymbol') + " ' attr(data-content-template);" + labelBase + labelTop + "}",
                ]);

				if (getDefault('highlightVisibilityData')) rules = rules.concat([	
					"[data-visibility]::before{content:'" + getDefault('visibilitySymbol') + " ' attr(data-visibility);" + labelBase + labelTop + "}",
				]);

				if (getDefault('highlightScopeData')) rules = rules.concat([	
					"[data-scope]{--data-reactive-color:" + colorScoped + "; outline:1px dashed var(--data-reactive-color);}",				
					"[data-scope]::after{content:attr(data-scope);" + labelBase + labelBottom + "}",
				]);

				if (getDefault('highlightActionData') && getDefault('highlightVisibilityData')) rules = rules.concat([	
					"[data-content][data-visibility]:not([data-effect])::before{content: attr(data-content) ' " + getDefault('visibilitySymbol') + " ' attr(data-visibility)}",
					"[data-effect][data-visibility]:not([data-content])::before{content: ' " + getDefault('effectSymbol') + " ' attr(data-effect) ' " + getDefault('visibilitySymbol') + " ' attr(data-visibility)}",
					"[data-content][data-effect][data-visibility]::before{content: attr(data-content)  ' " + getDefault('effectSymbol') + " ' attr(data-effect) ' " + getDefault('visibilitySymbol') + " ' attr(data-visibility)}",

				]);

				if (getDefault('highlightVisibilityArea')) rules = rules.concat([	
					"[data-visibility]:not([data-scope])::after {content:'';position: absolute;top: 0;left: 0;width: 100%;height: 100%;background-image:repeating-linear-gradient(45deg,transparent,transparent 10px,var(--data-reactive-color) 10px,var(--data-reactive-color) 20px);opacity: .1;}",
				]);
			
				rules.forEach((rule) => document.styleSheets[0].insertRule(rule, 0));
			}
		});   
	} else {
        window.addEventListener("DOMContentLoaded", function (event) {
            let visibilityMode = getDefault('visibilityMode');
            let rules = [];
    
            switch (visibilityMode) {
                case 'auto':
                    rules.push(
                        "[data-visibility][style*=\"visibility: hidden\"] [data-visibility] { visibility: hidden !important; }"
                    );
                    break;

                case 'manual':
                    rules.push(
                        "[style*=\"visibility: hidden\"] .inheritVisibility { visibility: hidden !important; }",
                        ".propagateVisibility[data-visibility][style*=\"visibility: hidden\"] [data-visibility] { visibility: hidden !important; }"
                    );
                    break;

                case 'none':
                default:
                    break;
            }
    
            rules.forEach((rule) => document.styleSheets[0].insertRule(rule, 0));
        });
    }
    
	return {
		version: '1.4.0',
		setDefault: setDefault,
		getDefault: getDefault,
		enableReactiveObject: enableReactiveObject,
		disableReactiveObject: disableReactiveObject,
		debounceByRequestFrame: debounceByRequestFrame,
	};
})();
