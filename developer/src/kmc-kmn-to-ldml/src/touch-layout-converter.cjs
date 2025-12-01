"use strict";
/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * Converts .keyman-touch-layout JSON to LDML keyboard format.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TouchLayoutConverter = void 0;
exports.generateLdmlFromTouchLayout = generateLdmlFromTouchLayout;
/**
 * Converts Keyman touch layout JSON to LDML keyboard structures.
 *
 * This class takes the .keyman-touch-layout JSON format (used by legacy Keyman keyboards)
 * and converts it to LDML keyboard elements (keys, flicks, layers). This enables migration
 * of existing touch layouts to the LDML format.
 *
 * The converter handles:
 * - Key definitions with outputs
 * - Long-press (subkey) gestures
 * - Multitap sequences
 * - Flick gestures (directional swipes)
 * - Gap/spacer keys
 * - Custom key widths
 * - Layer switching keys
 * - Special keys (shift, backspace, etc.)
 * - Phone and tablet layouts with different device widths
 *
 * @example
 * ```typescript
 * const converter = new TouchLayoutConverter();
 * const result = converter.convert(touchLayoutJson);
 * console.log(`Converted ${result.keys.length} keys and ${result.layers.length} layers`);
 * ```
 */
var TouchLayoutConverter = /** @class */ (function () {
    function TouchLayoutConverter() {
        this.keys = new Map();
        this.flicks = new Map();
        this.flickCounter = 0;
    }
    /**
     * Convert a touch layout file to LDML structures
     */
    TouchLayoutConverter.prototype.convert = function (layout) {
        this.keys.clear();
        this.flicks.clear();
        this.flickCounter = 0;
        var layers = [];
        // Process phone layout
        if (layout.phone) {
            var phoneLayers = this.convertPlatform(layout.phone, 'phone');
            layers.push.apply(layers, phoneLayers);
        }
        // Process tablet layout
        if (layout.tablet) {
            var tabletLayers = this.convertPlatform(layout.tablet, 'tablet');
            // Only add tablet layers if they differ from phone
            if (!layout.phone) {
                layers.push.apply(layers, tabletLayers);
            }
        }
        return {
            keys: Array.from(this.keys.values()),
            flicks: Array.from(this.flicks.values()),
            layers: layers,
            phoneMinWidth: layout.phone ? 0 : undefined,
            tabletMinWidth: layout.tablet ? 400 : undefined,
        };
    };
    /**
     * Convert a platform (phone/tablet) layout
     */
    TouchLayoutConverter.prototype.convertPlatform = function (platform, _platformType) {
        var layers = [];
        for (var _i = 0, _a = platform.layer || []; _i < _a.length; _i++) {
            var layer = _a[_i];
            layers.push(this.convertLayer(layer));
        }
        return layers;
    };
    /**
     * Convert a single layer
     */
    TouchLayoutConverter.prototype.convertLayer = function (layer) {
        var rows = [];
        for (var _i = 0, _a = layer.row || []; _i < _a.length; _i++) {
            var row = _a[_i];
            var keyIds = [];
            for (var _b = 0, _c = row.key || []; _b < _c.length; _b++) {
                var key = _c[_b];
                var ldmlKey = this.convertKey(key);
                keyIds.push(ldmlKey.id);
            }
            rows.push(keyIds);
        }
        // Map layer ID to LDML conventions
        var ldmlLayerId = this.mapLayerId(layer.id);
        return {
            id: ldmlLayerId,
            modifiers: this.getModifiersForLayerId(layer.id),
            rows: rows,
        };
    };
    /**
     * Convert a single key
     */
    TouchLayoutConverter.prototype.convertKey = function (key) {
        var _this = this;
        var keyId = key.id || this.generateKeyId(key);
        // Check if we already have this key
        if (this.keys.has(keyId)) {
            return this.keys.get(keyId);
        }
        var ldmlKey = {
            id: keyId,
        };
        // Set output from text
        if (key.text && !key.text.startsWith('*')) {
            ldmlKey.output = key.text;
        }
        // Handle special key types
        if (key.sp === 10 /* TouchLayout.TouchLayoutKeySp.spacer */ || key.sp === 9 /* TouchLayout.TouchLayoutKeySp.blank */) {
            ldmlKey.gap = true;
        }
        // Handle width
        if (key.width && key.width !== 100) {
            ldmlKey.width = key.width / 100; // Convert from percentage to ratio
        }
        // Handle layer switch
        if (key.nextlayer) {
            ldmlKey.layerId = this.mapLayerId(key.nextlayer);
        }
        // Handle long press (subkeys)
        if (key.sk && key.sk.length > 0) {
            var subkeyIds = key.sk.map(function (sk) { return _this.convertSubkey(sk); });
            ldmlKey.longPressKeyIds = subkeyIds.join(' ');
            // Find default subkey
            var defaultSk = key.sk.find(function (sk) { return sk.default; });
            if (defaultSk) {
                ldmlKey.longPressDefaultKeyId = this.getSubkeyId(defaultSk);
            }
        }
        // Handle flicks
        if (key.flick) {
            var flickId = this.convertFlick(key.flick, keyId);
            if (flickId) {
                ldmlKey.flickId = flickId;
            }
        }
        // Handle multitap
        if (key.multitap && key.multitap.length > 0) {
            var multitapIds = key.multitap.map(function (mt) { return _this.convertSubkey(mt); });
            ldmlKey.multiTapKeyIds = multitapIds.join(' ');
        }
        this.keys.set(keyId, ldmlKey);
        return ldmlKey;
    };
    /**
     * Convert a subkey and return its ID
     */
    TouchLayoutConverter.prototype.convertSubkey = function (subkey) {
        var id = this.getSubkeyId(subkey);
        // Add key definition if not exists
        if (!this.keys.has(id)) {
            this.keys.set(id, {
                id: id,
                output: subkey.text,
            });
        }
        return id;
    };
    /**
     * Get or generate subkey ID
     */
    TouchLayoutConverter.prototype.getSubkeyId = function (subkey) {
        if (subkey.id) {
            return subkey.id;
        }
        // Generate from text
        if (subkey.text && subkey.text.length === 1) {
            var code = subkey.text.codePointAt(0);
            return "U_".concat(code.toString(16).toUpperCase().padStart(4, '0'));
        }
        return "T_SK_".concat(Date.now());
    };
    /**
     * Convert flick gestures
     */
    TouchLayoutConverter.prototype.convertFlick = function (flick, keyId) {
        var segments = [];
        // Map each direction
        var directions = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
        for (var _i = 0, directions_1 = directions; _i < directions_1.length; _i++) {
            var dir = directions_1[_i];
            var subkey = flick[dir];
            if (subkey) {
                var subkeyId = this.convertSubkey(subkey);
                segments.push({
                    directions: dir,
                    keyId: subkeyId,
                });
            }
        }
        if (segments.length === 0) {
            return null;
        }
        var flickId = "flick_".concat(keyId, "_").concat(this.flickCounter++);
        this.flicks.set(flickId, {
            id: flickId,
            segments: segments,
        });
        return flickId;
    };
    /**
     * Generate a key ID from key properties
     */
    TouchLayoutConverter.prototype.generateKeyId = function (key) {
        if (key.text && key.text.length === 1 && !key.text.startsWith('*')) {
            var code = key.text.codePointAt(0);
            return "U_".concat(code.toString(16).toUpperCase().padStart(4, '0'));
        }
        return "T_KEY_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 6));
    };
    /**
     * Map touch layout layer ID to LDML layer ID
     */
    TouchLayoutConverter.prototype.mapLayerId = function (layerId) {
        // Common mappings
        var mapping = {
            'default': 'base',
            'shift': 'shift',
            'caps': 'caps',
            'symbol': 'symbol',
            'numeric': 'numeric',
            'rightalt': 'altR',
            'rightalt-shift': 'altR-shift',
        };
        return mapping[layerId.toLowerCase()] || layerId;
    };
    /**
     * Get LDML modifiers for a layer ID
     */
    TouchLayoutConverter.prototype.getModifiersForLayerId = function (layerId) {
        var mapping = {
            'shift': 'shift',
            'caps': 'caps',
            'rightalt': 'altR',
            'rightalt-shift': 'shift altR',
        };
        return mapping[layerId.toLowerCase()];
    };
    return TouchLayoutConverter;
}());
exports.TouchLayoutConverter = TouchLayoutConverter;
/**
 * Generate LDML XML fragments from touch layout conversion
 */
function generateLdmlFromTouchLayout(result, indent) {
    var _a;
    if (indent === void 0) { indent = '  '; }
    var xml = '';
    // Generate keys section
    if (result.keys.length > 0) {
        xml += "".concat(indent, "<keys>\n");
        for (var _i = 0, _b = result.keys; _i < _b.length; _i++) {
            var key = _b[_i];
            xml += "".concat(indent).concat(indent, "<key id=\"").concat(key.id, "\"");
            if (key.output)
                xml += " output=\"".concat(escapeXml(key.output), "\"");
            if (key.gap)
                xml += " gap=\"true\"";
            if (key.width)
                xml += " width=\"".concat(key.width, "\"");
            if (key.layerId)
                xml += " layerId=\"".concat(key.layerId, "\"");
            if (key.longPressKeyIds)
                xml += " longPressKeyIds=\"".concat(key.longPressKeyIds, "\"");
            if (key.longPressDefaultKeyId)
                xml += " longPressDefaultKeyId=\"".concat(key.longPressDefaultKeyId, "\"");
            if (key.multiTapKeyIds)
                xml += " multiTapKeyIds=\"".concat(key.multiTapKeyIds, "\"");
            if (key.flickId)
                xml += " flickId=\"".concat(key.flickId, "\"");
            xml += "/>\n";
        }
        xml += "".concat(indent, "</keys>\n");
    }
    // Generate flicks section
    if (result.flicks.length > 0) {
        xml += "".concat(indent, "<flicks>\n");
        for (var _c = 0, _d = result.flicks; _c < _d.length; _c++) {
            var flick = _d[_c];
            xml += "".concat(indent).concat(indent, "<flick id=\"").concat(flick.id, "\">\n");
            for (var _e = 0, _f = flick.segments; _e < _f.length; _e++) {
                var seg = _f[_e];
                xml += "".concat(indent).concat(indent).concat(indent, "<flickSegment directions=\"").concat(seg.directions, "\" keyId=\"").concat(seg.keyId, "\"/>\n");
            }
            xml += "".concat(indent).concat(indent, "</flick>\n");
        }
        xml += "".concat(indent, "</flicks>\n");
    }
    // Generate layers section
    if (result.layers.length > 0) {
        var minWidth = (_a = result.phoneMinWidth) !== null && _a !== void 0 ? _a : 0;
        xml += "".concat(indent, "<layers formId=\"touch\" minDeviceWidth=\"").concat(minWidth, "\">\n");
        for (var _g = 0, _h = result.layers; _g < _h.length; _g++) {
            var layer = _h[_g];
            xml += "".concat(indent).concat(indent, "<layer id=\"").concat(layer.id, "\"");
            if (layer.modifiers)
                xml += " modifiers=\"".concat(layer.modifiers, "\"");
            xml += ">\n";
            for (var _j = 0, _k = layer.rows; _j < _k.length; _j++) {
                var row = _k[_j];
                xml += "".concat(indent).concat(indent).concat(indent, "<row keys=\"").concat(row.join(' '), "\"/>\n");
            }
            xml += "".concat(indent).concat(indent, "</layer>\n");
        }
        xml += "".concat(indent, "</layers>\n");
    }
    return xml;
}
function escapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
