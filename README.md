# Hype Reactive Content

![HypeReactiveContent|690x487](https://playground.maxziebell.de/Hype/ReactiveContent/HypeReactiveContent.jpg)

A small custom tailored extension to use hypeDocument.customData in a reactive manner.


Content Delivery Network (CDN)
--

Latest version can be linked into your project using the following in the head section of your project:

```html
<script src="https://cdn.jsdelivr.net/gh/worldoptimizer/HypeReactiveContent/HypeReactiveContent.min.js"></script>
```
Optionally you can also link a SRI version or specific releases. 
Read more about that on the JsDelivr (CDN) page for this extension at https://www.jsdelivr.com/package/gh/worldoptimizer/HypeReactiveContent

Learn how to use the latest extension version and how to combine extensions into one file at
https://github.com/worldoptimizer/HypeCookBook/wiki/Including-external-files-and-Hype-extensions

---

# Documentation

The Hype Reactive Content Library is a powerful tool that allows you to create reactive content with data binding and visibility control for your Hype projects. This library is designed to work seamlessly with Tumult Hype and provides an easy way to manage and update your project's content by using data attributes.

## Getting Started

To start using the Hype Reactive Content Library, follow these steps:

1. Include the library file in your Hype project.
2. Set up custom data properties and data attributes in your project elements.
3. Use the provided API functions to manage and update your content.

## Frequently Asked Questions (FAQ)

**Q: How do I include the Hype Reactive Content Library in my project?**

A: To include the library in your project, add the Hype Reactive Content script file to your project's resources, and include the script file in the head section of your exported HTML file.

**Q: How do I set up custom data properties and data attributes for my elements?**

A: You can set up custom data properties by adding them to the `data-*` attributes in your HTML elements. For example, use `data-content` to set the content of an element based on the custom data property, and `data-visibility` to control the visibility of an element.

**Q: Can I use the Hype Reactive Content Library with other Hype extensions?**

A: Yes, the Hype Reactive Content Library is designed to work seamlessly with other Hype extensions, such as Hype Action Events and Hype Data Magic.

**Q: How do I update the content of my elements when a custom data property changes?**

A: In general, the content automatically refreshes when you change a value. It uses a debounce approach and if you need to update immediately you can use `hypeDocument.refreshReactiveContent` function, which updates the content and visibility of your elements based on the custom data properties.

**Q: How do I use the `data-effect` attribute in my elements?**

A: To use the `data-effect` attribute, simply add it to your HTML elements and assign it a value that is a valid JavaScript code. This code will be run dynamically and can interact with the custom data properties.

**Q: What kind of effects can I create with the `data-effect` attribute?**

A: The `data-effect` attribute allows dynamic JavaScript code execution, which means you can create a wide range of effects such as changing color, size, position or any other property based on some data change.

**Q: How do I update the effect of my elements when a custom data property changes?**

A: The `data-effect` attribute is reactive, so any changes in the custom data property will automatically trigger the code in the `data-effect` attribute, updating the effect accordingly.


## Data Attributes

| Attribute           | Function                                                                                                                                                    |
|---------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `data-content`      | Sets the content of an element based on the custom data property. Supports data scoping with the `⇢` symbol.                                              |
| `data-visibility`   | Controls the visibility of an element based on the custom data property. Supports data scoping with the `⇢` symbol.                                        |
| `data-scope`        | Defines the data scope for an element.                                                                                                                     |
| `data-content-changed-action` | Triggers a custom action when the content is changed. <sup>1</sup>                                                                                                    |
| `data-content-changed-behavior` | Triggers a custom behavior when the content is changed. <sup>1</sup>                                                                                                 |
| `data-visibility-changed-action` | Triggers a custom action when the visibility is changed. <sup>1</sup>                                                                                               |
| `data-visibility-changed-behavior` | Triggers a custom behavior when the visibility is changed. <sup>1</sup>                                                                                            |
| `data-effect`      | Controls the behavior or animation of an element based on the custom data property. Supports data scoping with the `⇢` symbol and allows dynamic JavaScript code execution. |
| `data-content-template` | Defines a template that can be used for dynamic content generation using {{variable}} syntax. |

## Content Return Types

The `data-content` attribute supports various return types:

| Type | Description |
|------|-------------|
| String | Regular text content that will be set as innerHTML |
| HTMLElement | A DOM element that will be directly appended to the target |
| DocumentFragment | A document fragment that will be directly appended to the target |
| `null` | Explicitly returning null will skip the content update |

## Extended hypeDocument API

| Function                                | Description                                                                                                                   |
|-----------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| `hypeDocument.refreshReactiveContent()` | Refreshes the content and visibility of elements based on custom data properties.                                            |
| `hypeDocument.refreshReactiveContentDebounced()` | Debounced version of `refreshReactiveContent`. Refreshes the content and visibility of elements based on custom data properties.|
| `hypeDocument.resolveClosestScope(elm)` | Resolves the closest data scope for the provided element.                                                                   |
| `hypeDocument.enableReactiveCustomData(data)` | Enables reactive custom data for the Hype document, making it update automatically when custom data properties change.    |
| `hypeDocument.setContentTemplateByName(templateName, templateContent, forceRefresh)` | Sets a named template for use with data-content-template. |
| `hypeDocument.setContentTemplates(templates, forceRefresh)` | Sets multiple templates at once. |
| `hypeDocument.flushContentTemplateByName(templateName, forceRefresh)` | Removes a specific template. |
| `hypeDocument.flushContentTemplates(forceRefresh)` | Removes all templates. |

These commands are part of the Hype Reactive Content Library and are accessible through the `hypeDocument` object.

## Development and Debugging

When working in preview mode, Hype Reactive Content provides visual feedback for content updates:

- Content changes are highlighted with a brief red overlay
- The highlight is only visible in preview mode
- The highlight duration can be controlled via `HypeReactiveContent.setDefault('redrawHighlightDuration', milliseconds)`
- Highlighting can be toggled via `HypeReactiveContent.setDefault('trackRedraws', boolean)`

This visual feedback helps developers track when and where content updates occur in their application.

## Template Support

The library supports template-based content using the {{variable}} syntax:

1. Define a template using `data-content-template="templateName"`
2. Use variables in your template with `{{variableName}}`
3. Templates can access scoped data using the arrow symbol (⇢)
4. Templates are processed reactively, updating whenever referenced variables change

Example:
```html
<div data-content-template="userCard">
  <h2>{{user.name}}</h2>
  <p>{{user.email}}</p>
</div>
```

Templates can be managed programmatically using the template management functions in the hypeDocument API.

## HypeReactiveContent API

| Function                        | Description                                                                                                                                    |
|---------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| `HypeReactiveContent.setDefault(key, value)`        | Allows overriding a global default by key or if an object is given as key to override all default at once.                                     |
| `HypeReactiveContent.getDefault(key)`               | Returns the value of a default by key or all default if no key is given.                                                                       |
| `HypeReactiveContent.enableReactiveObject(obj, callback, _key)` | Makes an object reactive and fires a callback on set operations. Returns the object as a proxy.                                               |
| `HypeReactiveContent.disableReactiveObject(obj)`    | Makes an object non-reactive. Returns the object as a non-reactive object.                                                                     |
| `HypeReactiveContent.debounceByRequestFrame(fn)`    | Debounces a function by requestAnimationFrame. Returns the debounced function.          

---

<sup>(1) When using Hype Reactive Content, changes made to child elements with data-content or data-visibility attributes will propagate upwards in the DOM, triggering any custom behavior or action specified in the corresponding data-content-changed-behavior, data-visibility-changed-behavior, data-content-changed-action, or data-visibility-changed-action attributes. This means that if a child element's content or visibility changes, any parent elements with these custom attributes will be updated accordingly.</sup>
