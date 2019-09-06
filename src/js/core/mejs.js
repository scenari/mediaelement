'use strict';

import window from 'global/window';

// Namespace
const mejs = {};

// version number
mejs.version = '4.2.12';

// Basic HTML5 settings
mejs.html5media = {
	/**
	 * @type {String[]}
	 */
	properties: [
		// GET/SET
		'volume', 'src', 'currentTime', 'muted',

		// GET only
		'duration', 'paused', 'ended', 'buffered', 'error', 'networkState', 'readyState', 'seeking', 'seekable', 'videoWidth', 'videoHeight',

		// OTHERS
		'currentSrc', 'preload', 'bufferedBytes', 'bufferedTime', 'initialTime', 'startOffsetTime',
		'defaultPlaybackRate', 'playbackRate', 'played', 'autoplay', 'loop', 'controls'
	],
	readOnlyProperties: [
		'duration', 'paused', 'ended', 'buffered', 'error', 'networkState', 'readyState', 'seeking', 'seekable', 'videoWidth', 'videoHeight'
	],
	/**
	 * @type {String[]}
	 */
	methods: [
		'load', 'play', 'pause', 'canPlayType'
	],
	/**
	 * @type {String[]}
	 */
	events: [
		'loadstart', 'durationchange', 'loadedmetadata', 'loadeddata', 'progress', 'canplay', 'canplaythrough',
		'suspend', 'abort', 'error', 'emptied', 'stalled', 'play', 'playing',  'pause', 'waiting', 'seeking',
		'seeked', 'timeupdate', 'ended', 'ratechange', 'volumechange', 'resize'
	],
	/**
	 * @type {String[]}
	 */
	mouseEvents: [
		'click', 'dblclick', 'mouseover', 'mouseout'
	],
	/**
	 * @type {String[]}
	 */
	mediaTypes: [
		'audio/mp3', 'audio/ogg', 'audio/oga', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/x-pn-wav', 'audio/mpeg', 'audio/mp4',
		'video/mp4', 'video/webm', 'video/ogg', 'video/ogv'
	]/*lez*/
};

window.mejs = mejs;

export default mejs;
