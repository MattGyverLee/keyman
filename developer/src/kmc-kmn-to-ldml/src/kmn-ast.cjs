"use strict";
/*
 * Keyman is copyright (C) SIL International. MIT License.
 *
 * AST (Abstract Syntax Tree) types for KMN keyboard source files.
 * These types represent the parsed structure of a .kmn file.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYSTEM_STORES = exports.KmnStoreType = void 0;
var KmnStoreType;
(function (KmnStoreType) {
    KmnStoreType[KmnStoreType["Normal"] = 1] = "Normal";
    KmnStoreType[KmnStoreType["Reserved"] = 2] = "Reserved";
    KmnStoreType[KmnStoreType["Option"] = 4] = "Option";
    KmnStoreType[KmnStoreType["Debug"] = 8] = "Debug";
    KmnStoreType[KmnStoreType["Call"] = 16] = "Call";
})(KmnStoreType || (exports.KmnStoreType = KmnStoreType = {}));
/**
 * Known system store names
 */
exports.SYSTEM_STORES = [
    'NAME',
    'VERSION',
    'COPYRIGHT',
    'MESSAGE',
    'BITMAP',
    'HOTKEY',
    'LANGUAGE',
    'LAYOUT',
    'TARGETS',
    'VISUALKEYBOARD',
    'LAYOUTFILE',
    'KEYBOARDVERSION',
    'KMW_RTL',
    'KMW_HELPFILE',
    'KMW_HELPTEXT',
    'KMW_EMBEDJS',
    'KMW_EMBEDCSS',
    'WINDOWSLANGUAGES',
    'ETHNOLOGUECODE',
    'MNEMONICLAYOUT',
    'CASEDKEYS',
    'AUTHOR',
    'CAPSONONLY',
    'CAPSALWAYSOFF',
    'SHIFTFREESCAPS',
    'INCLUDECODES',
    'TARGETS',
];
