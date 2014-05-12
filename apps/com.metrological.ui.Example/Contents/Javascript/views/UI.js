var UI = new MAF.Class({
	ClassName: 'UI',

	Extends: MAF.system.FullscreenView,

	initialize: function () {
		this.parent();
		this.registerMessageCenterListenerCallback(this.dataHasChanged);
		this.clockTimerId = this.setClock.periodical(60000, this);
		MAF.mediaplayer.init();
		this.channelChange.subscribeTo(MAF.mediaplayer, 'onChannelChange', this);
		this.onActivateBackButton.subscribeTo(MAF.application, 'onActivateBackButton', this);
	},

	dataHasChanged: function (event) {
		if (event.payload.value && event.payload.key === 'myApps') {
			this.controls.myApps.changeDataset(event.payload.value, true);
			this.controls.myMenu.changeDataset([
				{ label: $_('Apps'), meta: $_('AppMeta') },
				{ label: $_('Channel'), meta: $_('ChannelMeta') },
				{ label: $_('Settings'), meta: $_('SettingsMeta') }
			]);
			this.controls.myMenu.cells[0].text.setText($_('Apps'));
		}
	},

	channelChange: function () {
		var currentProgram = MAF.mediaplayer.getCurrentProgram();
		this.elements.myEPG.changeDataset([currentProgram], true);
		if (document.activeElement && this.elements.myEPG.cells.indexOf(document.activeElement.owner) > -1) {
			this.elements.meta.setText($_('NowWatching') + currentProgram.title);
		}
	},

	setClock: function () {
		this.elements.datetime.setText(Date.format(new Date(), 'D MMM YYYY HH:mm'));
	},

	animteBar: function (fadeIn, fadeOut, barHeight, barOffset){
		fadeOut.animate({
			opacity: 0,
			duration: 0.2,
			events: {
				onAnimationEnded: function () {
					fadeOut.visible = false;
				}
			}
		});
		this.elements.menuBackground.animate({
			height: barHeight,
			vOffset: barOffset,
			duration: 0.5
		});
		this.elements.menuTop.animate({
			vOffset: barOffset - 54,
			duration: 0.5
		});
		this.elements.menuBottom.animate({
			vOffset: barOffset + barHeight,
			duration: 0.5
		});
		fadeIn.animate({
			visible: true,
			opacity: 1,
			delay: 0.2,
			duration: 0.3,
			events: {
				onAnimationEnded: function () {
					fadeIn.focus();
				}
			}
		});
	},

	onActivateBackButton: function (event) {
		if (!this.frozen) {
			if (this.controls.myApps.visible){
				this.animteBar(this.controls.myMenu, this.controls.myApps, 100, 725);
				event.preventDefault();
			} else if (this.elements.myEPG.visible){
				this.animteBar(this.controls.myMenu, this.elements.myEPG, 100, 725);
				event.preventDefault();
			}
		}
	},

	createView: function () {
		this.elements.menuBackground = new MAF.element.Container({
			styles: {
				transform: 'translateZ(0)',
				backgroundColor: 'rgba(22,22,27,.9)',
				width: this.width,
				height: 100,
				vOffset: 725
			}
		}).appendTo(this);

		new MAF.element.Image({
			src: 'Images/ml.png',
			styles: {
				width: 320,
				height: 67,
				hOffset: this.width - 350,
				vOffset: this.elements.menuBackground.outerHeight + 140
			}
		}).appendTo(this);

		this.elements.menuTop = new MAF.element.Container({
			styles: {
				backgroundColor: 'rgba(22,22,27,.5)',
				width: this.width,
				height: 54,
				vOffset: this.elements.menuBackground.vOffset - 54
			}
		}).appendTo(this);

		this.elements.datetime = new MAF.element.Text({
			label: Date.format(new Date(), 'D MMM YYYY HH:mm'),
			styles: {
				fontSize: 25,
				opacity: 0.7,
				width: this.width - 40,
				height: this.elements.menuTop.height,
				anchorStyle: 'rightCenter'
			}
		}).appendTo(this.elements.menuTop);

		this.elements.menuBottom = new MAF.element.Container({
			styles: {
				backgroundColor: 'rgba(255,0,0,.5)',
				width: this.width,
				height: 57,
				vOffset: this.elements.menuBackground.outerHeight
			}
		}).appendTo(this);

		this.elements.meta = new MAF.element.Text({
			styles: {
				fontSize: 25,
				width: this.width - 40,
				height: this.elements.menuBottom.height,
				anchorStyle: 'center',
				truncation: 'end'
			}
		}).appendTo(this.elements.menuBottom);

		this.controls.myMenu = new MAF.element.Grid({
			guid: 'MyMenu',
			rows: 1,
			columns: 3,
			carousel: true,
			dataset: [
				{ label: $_('Apps') + ' ' + FontAwesome.get(['refresh', 'spin']), meta: $_('AppMeta') },
				{ label: $_('Channel'), meta: $_('ChannelMeta') },
				{ label: $_('Settings'), meta: $_('SettingsMeta') }
			],
			cellCreator: function () {
				var cell = new MAF.element.GridCell({
					styles: Object.merge(this.getCellDimensions(), {
						transform: 'translateZ(0)'
					}),
					events: {
						onSelect: function (event) {
							var data = this.getCellDataItem(),
								view = this.grid.owner.owner,
								label = data.label.split(' ')[0];
							switch (label) {
								case $_('Apps'):
									var myApps = MAF.messages.fetch('myApps') || [];
									if (myApps.length > 0)
										view.animteBar(view.controls.myApps, view.controls.myMenu, 230, 660);
									break;
								case $_('Channel'):
									view.animteBar(view.elements.myEPG, view.controls.myMenu, 230, 660);
									view.elements.myEPG.changeDataset([MAF.mediaplayer.getCurrentProgram()], true);
									break;
								case $_('Settings'):
									break;
								default:
									break;
							}
						},
						onFocus: function () {
							var view = this.grid.owner.owner,
								item = this.getCellDataItem();
							if (item.label === $_('Channel')) {
								var currentProgram = MAF.mediaplayer.getCurrentProgram();
								view.elements.meta.setText($_('NowWatching') + currentProgram.title);
							} else {
								view.elements.meta.setText(item.meta);
							}
							this.text.animate({
								color: 'rgba(255,255,255,1)',
								scale: 1.3,
								duration: 0.2
							});
						},
						onBlur: function () {
							this.text.animate({
								color: 'rgba(255,255,255,.5)',
								scale: 1,
								duration: 0.2
							});
						}
					}
				});
				cell.text = new MAF.element.Text({
					styles: {
						color: 'rgba(255,255,255,.5)',
						fontSize: 50,
						width: cell.width,
						height: cell.height,
						anchorStyle: 'center'
					}
				}).appendTo(cell);
				return cell;
			},
			cellUpdater: function (cell, data) {
				cell.text.setText(data.label);
			},
			styles: {
				width: this.width,
				height: 100
			}
		}).appendTo(this.elements.menuBackground);

		this.controls.myApps = new MAF.element.Grid({
			guid: 'MyApps',
			rows: 1,
			columns: 9,
			carousel: true,
			dataset: MAF.messages.fetch('myApps') || [],
			cellCreator: function () {
				var cell = new MAF.element.GridCell({
					styles: Object.merge(this.getCellDimensions(), {
						transform: 'translateZ(0)',
						overflow: 'visible'
					}),
					events: {
						onSelect: function (event) {
							var id = this.getCellDataItem();
							ApplicationManager.load(id);
							ApplicationManager.open(id);
						},
						onFocus: function () {
							this.focusImg.visible = true;
							this.focusImg.animate({
								opacity: 1,
								duration: 0.2
							});
							this.animate({
								scale: 1.1,
								duration: 0.2
							});
							var data = ApplicationManager.getMetadata(this.getCellDataItem());
							this.getView().elements.meta.setText(data.name + ' - ' + data.description);
						},
						onBlur: function () {
							this.focusImg.animate({
								opacity: 0,
								duration: 0.2
							});
							this.animate({
								scale: 1,
								duration: 0.2
							});
							this.focusImg.visible = false;
						}
					}
				});

				cell.focusImg = new MAF.element.Image({
					src: 'Images/Icon-Focus.png',
					autoShow: false,
					styles: {
						visible: false,
						opacity: 0,
						width: 192,
						height: 192,
						hOffset: (cell.width - 192) / 2,
						vOffset: (cell.height - 192) / 2
					}
				}).appendTo(cell);

				cell.icon = new MAF.element.Image({
					hideWhileLoading: true,
					styles: {
						width: 192,
						height: 192,
						hOffset: (cell.width - 192) / 2,
						vOffset: (cell.height - 192) / 2
					}
				}).appendTo(cell);

				return cell;
			},
			cellUpdater: function (cell, data) {
				cell.icon.setSource(ApplicationManager.getIcon(data) || '');
			},
			styles: {
				overflow: 'visible',
				visible: false,
				width: 1800,
				height: 200,
				hOffset: (this.width - 1800) / 2,
				vOffset: 15,
				opacity: 0
			}
		}).appendTo(this.elements.menuBackground);

		this.elements.myEPG = new MAF.element.Grid({
			rows: 1,
			columns: 1,
			carousel: true,
			cellCreator: function () {
				var cell = new MAF.element.GridCell({
					styles: this.getCellDimensions(),
					events: {
						onFocus: function () {
						},
						onBlur: function () {
						}
					}
				});

				cell.program = new MAF.element.Text({
					visibleLines: 1,
					styles: {
						width: cell.width,
						height: cell.height,
						fontSize: 35,
						fontWeight: 'bold',
						truncation: 'end'
					}
				}).appendTo(cell);
				
				cell.desc = new MAF.element.Text({
					visibleLines: 4,
					styles: {
						width: cell.width,
						height: cell.height,
						fontSize: 27,
						vOffset: cell.program.outerHeight + 8,
						wrap: true,
						truncation: 'end'
					}
				}).appendTo(cell);

				return cell;
			},
			cellUpdater: function (cell, data) {
				cell.program.setText(data.title);
				cell.desc.setText(data.description);
				cell.grid.owner.owner.elements.meta.setText(MAF.mediaplayer.getCurrentChannel().name);
			},
			styles: {
				visible: false,
				width: 1800,
				height: 200,
				hOffset: (this.width - 1800) / 2,
				vOffset: 15,
				opacity: 0
			}
		}).appendTo(this.elements.menuBackground);
	},

	focusView: function () {
		if (MAF.messages.exists('myApps')) {
			this.controls.myMenu.cells[0].text.setText($_('Apps'));
		}
	},

	destroyView: function () {
		clearInterval(this.clockTimerId);
		delete this.clockTimerId;
	}
});
