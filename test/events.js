'use strict';
(function() {
	const ME_URI = '../build';
	const HLS_URI  = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/0.9.1/hls.js';
	const DASH_URI = 'https://cdnjs.cloudflare.com/ajax/libs/dashjs/2.9.0/dash.all.debug.js';
	var container;
	var preload;

	function importScript(src) {
		return new Promise(function (resolve, reject) {
			var script = document.createElement('script');
			script.src = src;
			script.addEventListener('load', resolve);
			script.addEventListener('error', reject);
			document.head.appendChild(script);
		});
	}

	function initNative(src) {
		return new Promise((resolve, reject) => {
			var media = document.createElement('video');
			media.setAttribute('preload', 'metadata');
			container.appendChild(media);
			media.src = src;
			media.addEventListener('error', reject);
			media.addEventListener('loadstart', () => {
				resolve(media);
			});
		});
	}
	
	var meImported = false;
	function initME(src) {
		if (!meImported) meImported = importScript(ME_URI + '/mediaelement.js');
		return meImported.then(function () {
			return new Promise((resolve, reject) => {
				var media = document.createElement('video');
				media.setAttribute('preload', preload);
				container.appendChild(media);

				new MediaElement(media, {
					hls: { path: HLS_URI },
					dash: { path: DASH_URI },
					error: function() {
						console.log(arguments);
						reject(arguments[0]);
					},
					success: (me) => {
						me.addEventListener('rendererready', () => {
							resolve(me);
						});
						me.src = src;
					}
				});
			});
		})
	}
	
	var hlsImported = false;
	function initHLS(src) {
		if (!hlsImported) hlsImported = importScript(HLS_URI);
		return hlsImported.then(function() {
			return new Promise((resolve, reject) => {
				var media = document.createElement('video');
				media.setAttribute('preload', preload);
				container.appendChild(media);

				var hls = new Hls();
				hls.loadSource(src);
				hls.attachMedia(media);
				hls.on(Hls.Events.MANIFEST_PARSED, () => {
					resolve(media);
				});
				hls.on(Hls.Events.ERROR, (event, data) => {
					reject(new Error(data.details));
				});
			});
		});
	}

	var dashImported = false;
	function initDash(src) {
		if (!dashImported) dashImported = importScript(DASH_URI);
		return dashImported.then(function() {
			return new Promise((resolve, reject) => {
				var media = document.createElement('video');
				media.setAttribute('preload', preload);
				container.appendChild(media);

				var dash = dashjs.MediaPlayer().create();
				dash.on(dashjs.MediaPlayer.events.MANIFEST_LOADED, (event) => {
					resolve(media);
				});

				dash.on(dashjs.MediaPlayer.events.ERROR, (event) => {
					reject(new Error(event.error));
				});

				dash.initialize(media, src, false);
				if (preload != "none") dash.setScheduleWhilePaused(true);
				dash.updatePortalSize();
				dash.duration();
			});
		});
	}

	function awaitEvent (element, eventName, afterListener) {
		return new Promise(function(resolve, reject) {
			element.addEventListener(eventName, function (event) {
				resolve(event);
			});
			if (afterListener) afterListener();
		});
	}

	var backends = {
		native: initNative,
		me: initME,
		hls: initHLS,
		dash: initDash
	};

	/* On chrome, the flags chrome://flags/#autoplay-policy should be set to 'No user gesture is required.' */
	function suite(initMedia, src) {
		describe('HTMLMediaElement Events', function () {
			afterEach(() => {
				while (container.firstChild) container.removeChild(container.firstChild);
			});

			it('.readyState', async function () {
				// https://html.spec.whatwg.org/#event-media-loadedmetadata
				let media = await initMedia(src);
				expect(media.readyState).to.be.a('number', 'readyState must be a number');
			});

			it('loadedmetadata', async function () {
				// https://html.spec.whatwg.org/#event-media-loadedmetadata
				let media = await initMedia(src);
				if (preload == "none") media.load();
				//expect(media.readyState).to.be.below(HTMLMediaElement.HAVE_METADATA, 'readyState is newly equal to HAVE_METADATA or greater for the first time');
				await awaitEvent(media, 'loadedmetadata');
				expect(media.readyState).to.be.at.least(HTMLMediaElement.HAVE_METADATA, 'readyState is newly equal to HAVE_METADATA or greater for the first time');
			});

			it('#getting-media-metadata (durationchange, resize)', async function () {
				// https://html.spec.whatwg.org/#getting-media-metadata
				let media = await initMedia(src);
				if (preload == "none") media.load();
				await awaitEvent(media, 'durationchange');
				expect(media.duration).to.be.above(0, 'The user agent has just determined the duration and dimensions');
				expect(media.duration).to.be.below(Infinity, 'The user agent has just determined the duration and dimensions');
				await awaitEvent(media, 'resize');
				expect(media.videoWidth).to.be.above(0, 'The user agent has just determined the duration and dimensions');
				expect(media.videoWidth).to.be.below(Infinity, 'The user agent has just determined the duration and dimensions');
				expect(media.videoHeight).to.be.above(0, 'The user agent has just determined the duration and dimensions');
				expect(media.videoHeight).to.be.below(Infinity, 'The user agent has just determined the duration and dimensions');
				await awaitEvent(media, 'loadedmetadata');
			});

			it('loadeddata', async function () {
				// https://html.spec.whatwg.org/#event-media-loadeddata
				let media = await initMedia(src);
				if (preload == "none") media.load();
				expect(media.readyState).to.be.below(HTMLMediaElement.HAVE_CURRENT_DATA, 'readyState newly increased to HAVE_CURRENT_DATA or greater for the first time.');
				await awaitEvent(media, 'loadeddata');
				expect(media.readyState).to.be.at.least(HTMLMediaElement.HAVE_CURRENT_DATA, 'readyState newly increased to HAVE_CURRENT_DATA or greater for the first time.');
			});

			it('canplay', async function () {
				// https://html.spec.whatwg.org/#event-media-canplay
				let media = await initMedia(src);
				if (preload == "none") media.load();
				expect(media.readyState).to.be.below(HTMLMediaElement.HAVE_FUTURE_DATA, 'readyState newly increased to HAVE_FUTURE_DATA or greater.');
				await awaitEvent(media, 'canplay');
				expect(media.readyState).to.be.at.least(HTMLMediaElement.HAVE_FUTURE_DATA, 'readyState newly increased to HAVE_FUTURE_DATA or greater.');
			});

			it('.paused', async function () {
				// https://html.spec.whatwg.org/#event-media-playing
				let media = await initMedia(src);
				expect(media.paused).to.be.a('boolean', 'paused must be a boolean');
				expect(media.paused).to.equal(true);
			});

			it('playing', async function () {
				// https://html.spec.whatwg.org/#event-media-playing
				let media = await initMedia(src);
				await awaitEvent(media, 'playing', () => {
					media.play();
				});
				expect(media.paused).to.equal(false);
			});

			it('play', async function () {
				// https://html.spec.whatwg.org/#event-media-playing
				let media = await initMedia(src);
				media.play();
				expect(media.paused).to.equal(false);
			});

			it('pause', async function () {
				// https://html.spec.whatwg.org/#event-media-playing
				let media = await initMedia(src);
				media.play();
				await awaitEvent(media, 'pause', () => {
					media.pause();
				});
				expect(media.paused).to.equal(true);
			});

			it('.ended', async function () {
				// https://html.spec.whatwg.org/#event-media-playing
				let media = await initMedia(src);
				expect(media.ended).to.be.a('boolean', 'paused must be a boolean');
				expect(media.ended).to.equal(false);
			});

			it('ended', async function () {
				// https://html.spec.whatwg.org/#event-media-playing
				let media = await initMedia(src);
				await awaitEvent(media, 'loadedmetadata');
				await awaitEvent(media, 'ended', () => {
					media.play();
					media.currentTime = media.duration - 0.1;
				});
				expect(media.ended).to.equal(true);
			});


			it('.seeking', async function () {
				// https://html.spec.whatwg.org/#event-media-playing
				let media = await initMedia(src);
				expect(media.seeking).to.be.a('boolean', 'seeking must be a boolean');
				expect(media.seeking).to.equal(false);
			});

			it('seeking', async function () {
				// https://html.spec.whatwg.org/#event-media-playing
				let media = await initMedia(src);
				await awaitEvent(media, 'seeking', () => {
					media.currentTime = 10;
				});
				expect(media.seeking).to.equal(true);
			});

			it('seeked', async function () {
				// https://html.spec.whatwg.org/#event-media-playing
				let media = await initMedia(src);
				await awaitEvent(media, 'seeked', () => {
					media.currentTime = 10;
				});
				expect(media.seeking).to.equal(false);
			});

			it('durationchange', async function () {
				// https://html.spec.whatwg.org/#event-media-durationchange
				let media = await initMedia(src);
				await awaitEvent(media, 'durationchange');
				expect(media.duration).to.be.above(0, 'The user agent has just determined the duration and dimensions');
				expect(media.duration).to.be.below(Infinity, 'The user agent has just determined the duration and dimensions');
			});

			it('.volume', async function () {
				// https://html.spec.whatwg.org/#event-media-playing
				let media = await initMedia(src);
				expect(media.volume).to.be.a('number', 'volume must be a number');
				expect(media.volume).to.equal(1);
			});

			it('volumechange#volume', async function () {
				let media = await initMedia(src);
				let volume = 0.123456789;
				await awaitEvent(media, 'volumechange', () => {
					media.volume = volume;
				});
				expect(media.volume).to.equal(volume);
			});

			it('volumechange#muted', async function () {
				let media = await initMedia(src);
				expect(media.muted).to.equal(false);
				await awaitEvent(media, 'volumechange', () => {
					media.muted = true;
				});
				expect(media.muted).to.equal(true);
			});
		});
	}


	mocha.setup('bdd');
	window.expect = chai.expect;
	document.addEventListener('DOMContentLoaded', function() {
		container = document.getElementById('container');
		let params = (new URL(document.location)).searchParams;
		let backend = params.has('backend') ? params.get('backend') : 'native';
		preload = params.has('preload') ? params.get('preload') : 'metadata';
		let src = params.has('src') ? params.get('src') : 'https://upload.wikimedia.org/wikipedia/commons/c/c0/Big_Buck_Bunny_4K.webm';
		suite(backends[backend], src);
		mocha.run();
	});
})();
