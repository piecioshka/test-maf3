//var version = '1.0.8s4c2r99';
var version = MAE.naf || '1.0.9s4c2r148',
	enableDebug = MAE.screenDebug || false;

NAF = {};
WebApp = {};

KeyMap.defineKeys(KeyMap.NORMAL, {
	19: 'pause', 413: 'stop', 415: 'playpause',
	417: 'forward', 412: 'rewind',
	3: 'back'
}, true);

include('naf-webapp/' + version + '/naf-webapp.min.js');

var model = new WebApp.Model(),
	controller = new WebApp.Controller(model);

controller.registerPMRPC();

var doFn = controller['do'],
	onFn = controller.on,
	offFn = controller.off;

var getApplicationIndex = (function () {
	var internalIndex = controller.getApplicationIndex;
	return function () {
		return internalIndex ? internalIndex() : 1;
	};
}());

onFn('model.initialized', function () {
	var i = getApplicationIndex();

	log('naf: base init');

	document.body.visible = false;

	plugins.exit = function () {
		doFn('model.state.applications.' + i + '.appMsg', {
			method: 'paused',
			message: {}
		});
	};

	var currentState;
	onFn('model.state.applications.' + i + '.state', function () {
		var state = model.state.applications[i].state;
		if (currentState === state) {
			return;
		}
		switch (state) {
			case 'paused':
				document.body.visible = false;
				plugins.players[0].src = null;
				if (active && active !== ui) {
					ApplicationManager.close(active);
				}
				break;
			case 'running':
				(function () {
					document.body.visible = true;
					if (active && apps[active]) {
						ApplicationManager.fire(active, 'onSelect', {
							id: apps[active].currentViewId
						});
					}
				}).delay(500);
				break;
		}
		currentState = state;
	});

	onFn('model.state.key', function () {
		var ev = model.state.key,
			keyCode = parseInt(ev.keyCode, 10),
			keyState = ev.keyState.toLowerCase(),
			keyEvent = document.createEvent('Events'),
			el = document.activeElement || window;
		if (keyState === 'repeat') {
			keyState = 'down';
		}
		keyEvent.initEvent('key' + keyState, true, true);
		keyEvent.keyCode = keyEvent.which = keyCode;
		keyEvent.key = KeyMap.lookupKey(KeyMap.NORMAL, keyCode);
		el.dispatchEvent(keyEvent);
	});

	function getMainMenuApplications(apps) {
		apps = apps || ApplicationManager.getApplications();
		var j = (i+1),
			ids = apps.filter(function (id) {
				return meta[id].menu === true;
			});
		ids.forEach(function (id) {
			var name = ApplicationManager.getMetadataByKey(id, 'name'),
				image = ApplicationManager.getIcon(id),
				url = ApplicationManager.getLaunchURL(id);
			doFn('model.state.applications.' + (j++) +
				'?name=' + name +
				'&type=webapp' + 
				'&id=' + id + 
				'&windowId=' + window.name + 
				'&url=' + url + 
				'&state=loaded' +
				'&viewState=hidden' +
				'&pictures=[' + image + ']');
		});
		doFn('model.state.applications.' + i + '?state=loaded');
	}

	function getApplicationsByChannelId(channelId) {
		var result = [],
			channel = model.channels && model.channels.filter(function (c) {
				return c.id === channelId;
			}) || [];
		if (channel.length > 0) {
			ApplicationManager.getApplicationsByChannelName(channel[0].name).forEach(function (id) {
				result.push({
					id: id,
					name: ApplicationManager.getMetadataByKey(id, 'name'),
					image: ApplicationManager.getIcon(id),
					url: ApplicationManager.getLaunchURL(id)
				});
			});
		}
		return [{
			id: ui,
			name: 'Apps',
			image: ApplicationManager.getIcon(ui),
			url: ApplicationManager.getMainURL('channel')
		}].concat(result);
	}

	function onMessageCallback() {
		var msg = model.state.applications[i].appMsg,
			uiId = model.state.applications[0].id,
			message;
		if (msg.sourceId !== uiId) {
			return;
		}
		switch (msg.method) {
			case 'getApplications':
				message = getApplicationsByChannelId(msg.message);
				break;
		}
		if (message) {
			doFn('model.state.applications.0.appMsg', {
				method: msg.method,
				message: message
			});
		}
	}

	onFn('model.state.applications.' + i + '.appMsg', onMessageCallback);

	if (ApplicationManager.complete) {
		getMainMenuApplications();
	} else {
		ApplicationManager.onComplete = getMainMenuApplications;
	}
});

var NAFPlayer = function () {
	var instance = this,
		internal = {},
		scale = 720 / 1080,
		states = Player.state,
		currentBounds = Player.prototype.bounds,
		currentSource,
		appIdx,
		readyForPlay = false,
		initialized = false;

	instance.subscribers = {};

	getter(internal, 'player', function () {
		return initialized ? model.state.players[0] : {};
	});

	function stateChange(state) {
		fire.call(instance, 'onStateChange', {
			state: state
		});
	}

	function l(s) {
		log(s);
		if (enableDebug) {
			screen.log(s);
		}
	}

	onFn('model.initialized', function () {
		if (!appIdx)
			appIdx = getApplicationIndex();

		log('naf: video init');

		initialized = true;

		// workaround because buffering ended is not available
		onFn('model.state.applications.' + appIdx + '.media.assets.*', function () {
			if (model.state.applications[appIdx].media.assets.length > 0 && !readyForPlay) {
				readyForPlay = true;
				l('MAF EVENT: INFOLOADED');
				stateChange(states.INFOLOADED);
			}
		});

		onFn('model.state.players.0.currentProgram', function () {
			if (model.state.applications[appIdx].media.assets.length === 0 && !instance.src) {
				l('MAF EVENT: CHANNELCHANGE');
				fire.call(instance, 'onChannelChange');
			}
		});

		onFn('model.state.players.0.status', function () {
			var status = internal.player.status;
			// ignore if souce is empty or asset is not yet loaded
			if (!instance.src || !status || model.state.applications[appIdx].media.assets.length === 0) {
				log('MAF INGNORED NAF PLAYER STATUS CODE: ' + (status && status.code || 'UNDEFINED'));
				return;
			}
			if (status) {
				l('MAF RECEIVED: NAF STATUS CODE: ' + status.code);
				switch (parseInt(status.code, 10)) {
					case 200: 
						//PRESENTATION_STARTED
						l('MAF EVENT: SEND PLAY');
						stateChange(states.PLAY);
						break;
					case 201:
						//BEGINNING_OF_CONTENT
						l('MAF EVENT: SEND PLAY');
						stateChange(states.PLAY);
						break;
					case 202:
						//END_OF_CONTENT
						l('MAF EVENT: SEND EOF');
						stateChange(states.EOF);
						break;
					case 204:
						l('MAF EVENT: SEND INFOLOADED');
						stateChange(states.INFOLOADED);
						break;
					case 101:
						//BUFFERING_CONTENT
						l('MAF EVENT: SEND BUFFERING');
						stateChange(states.BUFFERING);
						break;
					case 400:
						//GENERAL_ERROR
					case 470:
						//OTT_PLAYBACK_ERROR
					case 471:
						//OTT_UNKNOWN_ERROR
						l('MAF EVENT: SEND ERROR');
						stateChange(states.ERROR);
						break;
//					case 203:
					case 472:
						//OTT_CANCELLED
						l('MAF EVENT: SEND STOP');
						stateChange(states.STOP);
						break;
					default:
						log('MAF EVENT: IGNORED STATUS CODE: ' + status.code);
						break;
				}
			}
		});
	});

	function supports(mime) {
		return mime.indexOf('video/mp4') !== -1;
	}
	function notify(icon, message, type, identifier) {
		var t;
		switch(type) {
			case 'c2a':
				t = 'call2action';
				break;
			case 'alert':
				t = 'notification';
				break;
			case 'autostart':
				t = 'autostart';
				break;
			default:
				return;
		}
		var image = identifier && ApplicationManager.getIcon(identifier),
			url = identifier && ApplicationManager.getLaunchURL(identifier);
		doFn('model.state.applications.0.appMsg', {
			method: 'announceNotifications',
			message: [{
				id: identifier,
				image: image,
				url: url,
				event: {
					type: t,
					time: Date.now(),
					timeout: 30,
					message: message || '',
					image: image
				}
			}]
		});
	}
	function r(c) {
		return Math.floor(c * scale);
	}

	getter(instance, 'id', function () {
		return Player.TV;
	});
	getter(instance, 'type', function () {
		return Player.type.VIDEO;
	});
	getter(instance, 'supports', function () {
		return supports;
	});
	getter(instance, 'waitIndicator', function () {
		return false;
	});
	getter(instance, 'channel', function () {
		var channel = internal.player.currentChannel || {};
		return new TVChannel(channel.lcn, channel.name);
	});
	setter(instance, 'channel', function (number) {
		var channels = model.channels || [];
		channels.forEach(function (channel, i) {
			if (channel.lcn === number) {
				doFn('model.state.players.0', 'model.channels.' + i);
				return;
			}
		});
	});
	getter(instance, 'program', function () {
		var program = internal.player.currentProgram || {};
		return new TVProgram(program.title, program.description, program.startTime, program.duration);
	});
	getter(instance, 'startTime', function () {
		return 0;
	});
	setter(instance, 'startTime', function (time) {
		//@TODO
	});
	getter(instance, 'currentTime', function () {
		return parseFloat(internal.player.position);
	});
	setter(instance, 'currentTime', function (time) {
		if (this.src) {
			doFn('model.state.players.0?position=' + time + 's');
		}
	});
	getter(instance, 'rates', function () {
		return [1,2,6,12,30];
	});
	getter(instance, 'rate', function () {
		return parseInt(internal.player.playRate || 0, 10);
	});
	setter(instance, 'rate', function (rate) {
		if (this.src && parseInt(internal.player.playRate, 10) !== rate) {
			l('MAF CHANGE PLAY RATE: ' + rate);
			doFn('model.state.players.0?playRate=' + rate + 'x');
			if (rate > 1) {
				l('MAF EVENT: SEND FORWARD');
				stateChange(states.FORWARD);
			} else if (rate < 0) {
				l('MAF EVENT: SEND REWIND');
				stateChange(states.REWIND);
			} else {
				l('MAF EVENT: SEND ' + (rate === 0 ? 'PAUSE' : 'PLAY'));
				stateChange(rate === 0 ? states.PAUSE : states.PLAY);
			}
		}
	});
	getter(instance, 'duration', function () {
		return parseInt(internal.player.duration || 0, 10);
	});
	getter(instance, 'buffered', function () {
		//@TODO
		return 100;
	});
	getter(instance, 'muted', function () {
		//@TODO
		return false;
	});
	setter(instance, 'muted', function (mute) {
		//@TODO
	});
	getter(instance, 'volume', function () {
		//@TODO
		return 1;
	});
	setter(instance, 'volume', function (volume) {
		//@TODO
	});
	getter(instance, 'src', function () {
		return currentSource;
	});
	setter(instance, 'src', function (src) {
		if (!initialized) {
			return;
		} else if (src) {
			if (currentSource) {
				//stateChange(states.STOP);
				currentSource = undefined;
				readyForPlay = false;
				l('MAF CLEAR MEDIA ASSET');
				doFn('model.state.applications.' + appIdx + '.media.assets', '');
			}
			var asset = new model.MediaAsset('media.asset.video.0', '', src, null, 'video', null, null, '', null, null, null, null, null);
			currentSource = src;
			l('MAF EVENT: SEND BUFFERING');
			stateChange(states.BUFFERING);
			(function () {
				l('MAF SET MEDIA ASSET');
				doFn('model.state.applications.' + appIdx + '.media', asset);
			}).delay(500);
		} else if (currentSource) {
			currentSource = undefined;
			readyForPlay = false;
			l('MAF CLEAR MEDIA ASSET');
			doFn('model.state.applications.' + appIdx + '.media.assets', '');
			l('MAF RESTORE CHANNEL');
			doFn('model.state.players.0', 'model.state.players.0.currentChannel');
			l('MAF EVENT: SEND STOP');
			stateChange(states.STOP);
		}
	});
	getter(instance, 'paused', function () {
		return parseInt(internal.player.playRate || 0, 10) === 0;
	});
	setter(instance, 'paused', function (p) {
		if (this.src) {
			if (readyForPlay) {
				readyForPlay = false;
				l('MAF SET MEDIA ASSET TO PLAYER');
				doFn('model.state.players.0', 'model.state.applications.' + appIdx + '.media.assets.0');
				l('MAF EVENT: SEND PLAY');
				stateChange(states.PLAY);
			} else {
				l('MAF PLAYER: ' + (p ? 'PAUSE' : 'PLAY'));
				this.rate = (p ? 0 : 1);
			}
		}
	});
	getter(instance, 'bounds', function () {
		return currentBounds;
	});
	setter(instance, 'bounds', function (b) {
		if (b && b.length === 4) {
			doFn('model.state.players.0?window=' + r(b[0]) + ',' + r(b[1]) + ',' + r(b[2]) + ',' + r(b[3]));
			currentBounds = b;
		}
	});
	getter(instance, 'notify', function () {
		return notify;
	});
};
NAFPlayer.prototype = new Player();
NAFPlayer.prototype.constructor = NAFPlayer;

plugins.players.push(new NAFPlayer());

controller.init();
