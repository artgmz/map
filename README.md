# Map

## Description:
Creates an ESRI map object in a div of your choosing. You can then add layers to this map, including tiled for basemaps and dynamic, feature, and/or graphic for overlays.

Clicking anywhere on the map will trigger an event that you can subscribe to. Note that the returned data is a map point (web mercator format), which must then generally be converted to GPS coordinates using ESRI utility functions.

## Dependencies:
* jQuery 2.0.3+
* ESRI ArcGIS API 3.7

## Notes:
* You must initialize the module, which creates a map object, before working with it.
* At least one layer must have its "visible" property set to "true," or you won't see anything.
* By default, the map comes with a scalebar on the lower-left corner zoom-in/zoom-out buttons on the top-left corner. Panning is also enabled on init.

## Sample Usage:
```
map.init("sampleDiv");

var options = {
    url: "https://www.example.com/serviceEndpt",
    id: "layer1",
    visible: true,
};

map.addLayer("tiled", options);

```