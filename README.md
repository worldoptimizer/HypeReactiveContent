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



## Data Attributes

| Attribute           | Function                                                                                                                                                    |
|---------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `data-content`      | Sets the content of an element based on the custom data property. Supports data scoping with the `⇢` symbol.                                              |
| `data-visibility`   | Controls the visibility of an element based on the custom data property. Supports data scoping with the `⇢` symbol.                                        |
| `data-scope`        | Defines the data scope for an element.                                                                                                                     |
| `data-content-changed-action` | Triggers a custom action when the content is changed.                                                                                                    |
| `data-content-changed-behavior` | Triggers a custom behavior when the content is changed.                                                                                                 |
| `data-visibility-changed-action` | Triggers a custom action when the visibility is changed.                                                                                                |
| `data-visibility-changed-behavior` | Triggers a custom behavior when the visibility is changed.                                                                                             |


## Extended hypeDocument API

| Function                                | Description                                                                                                                   |
|-----------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| `hypeDocument.refreshReactiveContent()` | Refreshes the content and visibility of elements based on custom data properties.                                            |
| `hypeDocument.refreshReactiveContentDebounced()` | Debounced version of `refreshReactiveContent`. Refreshes the content and visibility of elements based on custom data properties.|
| `hypeDocument.resolveClosestScope(elm)` | Resolves the closest data scope for the provided element.                                                                   |
| `hypeDocument.enableReactiveCustomData(data)` | Enables reactive custom data for the Hype document, making it update automatically when custom data properties change.    |

These commands are part of the Hype Reactive Content Library and are accessible through the `hypeDocument` object.



## Returned API

| Function                        | Description                                                                                                                                    |
|---------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| `setDefault(key, value)`        | Allows overriding a global default by key or if an object is given as key to override all default at once.                                     |
| `getDefault(key)`               | Returns the value of a default by key or all default if no key is given.                                                                       |
| `enableReactiveObject(obj, callback, _key)` | Makes an object reactive and fires a callback on set operations. Returns the object as a proxy.                                               |
| `disableReactiveObject(obj)`    | Makes an object non-reactive. Returns the object as a non-reactive object.                                                                     |
| `debounceByRequestFrame(fn)`    | Debounces a function by requestAnimationFrame. Returns the debounced function.          
