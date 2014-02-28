// Map module.
// Contains map, layers, and graphics. Also uses TinyPubSub for jQuery.
var map = (function ($, esri) {
    "use strict";

    // Initialize map.
    // DIVID: Map container's div id.
    function init(divId) {
        var map = new esri.Map(divId, { logo: false, minZoom: 1 }),
            scalebar = new esri.dijit.Scalebar({ map: map });

        // Add button titles and disable zoom-out button. Also set scalebar background to white for readability (ESRI bugs).
        map.on("load", function () {
            $(".esriSimpleSliderIncrementButton").attr("title", "Zoom In");
            $(".esriSimpleSliderDecrementButton").attr("title", "Zoom Out");
            $(".esriSimpleSliderDecrementButton").addClass("esriSimpleSliderDisabledButton");
            $(".esriScalebar").css({ "background-color": "#FFF", "border": "2px solid #555",
                                     "border-radius": "4px", "padding": "3px", "width": "117px" });
        });

        // Update scalebar background width to maintain readability (ESRI bug).
        map.on("zoom-end", function (evt) {
            if (evt.level === 1) {
                $(".esriScalebar").css({ "width": "117px" });
            } else if (evt.level === 2 || evt.level === 3) {
                $(".esriScalebar").css({ "width": "145px" });
            } else if (evt.level === 4 || evt.level === 5) {
                $(".esriScalebar").css({ "width": "113px" });
            } else if (evt.level === 6 || evt.level === 7) {
                $(".esriScalebar").css({ "width": "142px" });
            }
        });

        // Emits event when map is clicked.
        map.on("click", function (evt) { $.publish("activated.map.all", [evt.mapPoint]); });

        // Resize the map to fit its new viewport, repositioning scalebar as necessary.
        // IMMEDIATE: Boolean indicating if resize should include ESRI's built-in delay.
        // DEFAULTPOS: Boolean indicating if scalebar should be placed in default position (ESRI bug).
        function resize(immediate, defaultPos) {
            map.resize(immediate);

            if (defaultPos) {
                $(".esriScalebar").css({ "background-color": "#FFF", "border": "2px solid #555",
                                         "border-radius": "4px", "bottom": "", "padding": "3px",
                                         "position": "", "width": $(".esriScalebar").css("width") });
            } else {
                $(".esriScalebar").css({ "background-color": "#FFF", "border": "2px solid #555",
                                         "border-radius": "4px", "bottom": "80px", "padding": "3px",
                                         "position": "absolute", "width": $(".esriScalebar").css("width") });
            }
        }

        // Center on a GPS map point. Zoom, if necessary, to specified level. Note that ESRI switches lat/lon order.
        // GPS: { lat, lon } where...
            // LAT: Point's latitude.
            // LON: Point's longitude.
        // ZOOM: Boolean indicating if viewport should zoom on point.
        // ZOOMLEVEL: Number indicating what level to zoom to. Ignored if ZOOM is false.
        function center(gps, zoom, zoomLevel) {
            if (zoom) {
                map.centerAndZoom(new esri.geometry.Point(gps.lon, gps.lat), zoomLevel);
            } else {
                map.centerAt(new esri.geometry.Point(gps.lon, gps.lat));
            }
        }

        // Add layer to map instance.
        // TYPE: Either "tiled"/"dynamic"/"feature"/"graphic". Defaults to "graphic".
        // ATTRS: { url, id, minScale, sublayers, visible, renderer } where...
            // URL: Location of layer service; required for tiled/feature/dynamic types.
            // ID: Name of layer to be created; required for all types.
            // SUBLAYERS: [] of numbers describing which sublayers to show; required for dynamic type.
            // VISIBLE: Whether layer is initially hidden/shown; required for all types.
            // RENDERER: <obj>, a valid ArcGIS renderer; required for graphic type.
        function addLayer(type, attrs) {
            var layer = null;

            if (type === "basemap") {
                layer = new esri.layers.ArcGISTiledMapServiceLayer(attrs.url, attrs);
            } else if (type === "dynamic") {
                layer = new esri.layers.ArcGISDynamicMapServiceLayer(attrs.url, attrs);
                layer.setVisibleLayers(attrs.sublayers);
            } else if (type === "feature") {
                layer = new esri.layers.FeatureLayer(attrs.url, attrs);
                layer.on("click", function (evt) { $.publish("activated.map.asset", [evt.graphic.attributes.OBJECTID]); });
            } else {
                layer = new esri.layers.GraphicsLayer(attrs);
                layer.setRenderer(attrs.renderer);
                layer.on("click", function (evt) { $.publish("activated.map.graphic", [evt.graphic.attributes]); });
            }

            map.addLayer(layer);
        }

        // Hide/show layer.
        // ID: Layer to be hidden/shown.
        function toggleLayer(id) {
            var layer = map.getLayer(id);
            layer.setVisibility(!layer.visible);
        }

        // Draw/redraw graphic at specified point, center/zoom-ing if necessary. Note that ESRI switches lat/lon order.
        // LAYERID: Layer to add graphic to. Should be graphics layer.
        // ATTRS: { lat, lon } where...
            // LAT: Point's latitude.
            // LON: Point's longitude.
        // SINGLEGFX: Boolean indicating if this is a single-graphic layer.
        function drawGFX(layerId, attrs, singleGFX) {
            var layer = map.getLayer(layerId);

            if (singleGFX && layer.graphics[0]) { // If single GFX layer and GFX exists, move it.
                layer.graphics[0].setGeometry(new esri.geometry.Point(attrs.lon, attrs.lat));
            } else { // If not single GFX layer and GFX exists at location, do nothing. Draw otherwise.
                for (var i = 0, len = layer.graphics.length; i < len; ++i) {
                    if (layer.graphics[i].attributes.lat === attrs.lat && layer.graphics[i].attributes.lon === attrs.lon) {
                        return;
                    }
                }

                layer.add(new esri.Graphic(new esri.geometry.Point(attrs.lon, attrs.lat), null, attrs));
            }
        }

        // Clear graphics from graphics layer.
        // LAYERID: Layer to clear graphics from; should be graphics layer.
        function clearGFX(layerId) { map.getLayer(layerId).clear(); }

        // Instance methods.
        return {
            resize: resize,
            center: center,
            addLayer: addLayer,
            toggleLayer: toggleLayer,
            drawGFX: drawGFX,
            clearGFX: clearGFX
        };
    }

    // Module method.
    return { init: init };
})(jQuery, esri);