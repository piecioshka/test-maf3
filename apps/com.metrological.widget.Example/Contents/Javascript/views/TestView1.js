var TestView1 = new MAF.Class({
	ClassName: 'TestView1',

	Extends: MAF.system.SidebarView,

	initialize: function () {
		//log(MAF.Browser);
		this.parent();
		this.registerMessageCenterListenerCallback(this.dataHasChanged);
	},

	dataHasChanged: function (event) {
		if (!this.frozen && event.payload.key === 'dataSet' && event.payload.value) {
			this.elements.grid1.changeDataset(event.payload.value);
			this.elements.tab2.setValue('3');
		}
	},

	createView: function () {
		var button1 = new MAF.control.TextButton({
			label: 'Load View 2',
			events: {
				onSelect: function () {
					MAF.application.loadView('view-TestView2');
				},
				onAnimationEnded: function () {
					log('animate ended');
				},
				onFocus: function () {
					this.animate({
						rotate: 182,
						duration: 0.5,
						callback: function () {
							log('callback1');
						}
					}).animate({
						//relative: true,
						rotate: 182,
						scale: 0.8,
						duration: 0.5,
						callback: function () {
							log('callback2');
						}
					});
				},
				onBlur: function () {
					this.animate({
						scale: 1,
						duration: 0.5
					}).animate({
						rotate: 2,
						duration: 0.5,
						callback: function (animator) {
							animator.reset();
						}
					});
				}
			}
		}).appendTo(this);

		button1.rotate = 2;

		var button2 = new MAF.control.TextButton({
			label: 'Set Tabs',
			styles: {
				vOffset: button1.outerHeight + 1
			},
			events: {
				onSelect: function () {
					this.owner.elements.tab1.initTabs([{
						label: 'Show demo type',
						value: '1',
						src: 'Images/tv.png'
					},{
						label: 'Show prod type',
						value: '2'
					},{
						label: 'Show all',
						value: '3',
						src: 'Images/tv.png'
					},{
						label: 'Tab 4',
						value: '4'
					},{
						label: 'Longer Tab button 5',
						value: '6',
						src: 'Images/tv.png'
					},{
						label: 'Longer Tab button 5',
						value: '7'
					},{
						label: 'Longer Tab button 5',
						value: '8'
					},{
						label: 'Tab 4',
						value: '9',
						src: 'Images/tv.png'
					},{
						label: 'Longer Tab button 5',
						value: '10'
					},{
						label: 'Tab 4',
						value: '11'
					}]);
				}
			}
		}).appendTo(this);

		var button3 = new MAF.control.TextButton({
			label: 'Reset Tabs',
			styles: {
				vOffset: button2.outerHeight + 1
			},
			events: {
				onSelect: function () {
					this.owner.elements.tab1.initTabs([]);
				}
			}
		}).appendTo(this);

		this.elements.tab1 = new MAF.control.TabPipe({
			defaultTab: 3,
			styles: {
				vOffset: button3.outerHeight + 1
			},
			events: {
				onTabSelect: function (event) {
					var view = this.getView();
					var grid = view.elements.grid1;
					switch (event.payload.index) {
						case 0:
							grid.setFilter(function (value,key) {
								if (value.type === 'demo')
									return value;
							});
							break;
						case 1:
							grid.setFilter(function (value,key) {
								if (value.type === 'prod')
									return value;
							});
							break;
						case 2:
							grid.setFilter(function (value,key) {
								if (value.type !== 'all')
									return value;
							});
							break;
					}
					grid.focus();
				}
			}
		}).appendTo(this);

		this.elements.tab2 = new MAF.control.FixedTab({
			options: [{
				label: 'Show demo type',
				value: 1
			},{
				label: 'Show prod type',
				value: 2
			},{
				label: 'Show all',
				value: 3
			}],
			styles: {
				vOffset: this.elements.tab1.outerHeight + 1
			},
			textStyles: {
				fontSize: 18,
				fontWeight: 'bold'
			},
			events: {
				onTabChanged: function (event) {
					var view = this.getView();
					var grid = view.elements.grid1;
					switch (event.payload.index) {
						case 0:
							grid.setFilter(function (value,key) {
								if (value.type === 'demo')
									return value;
							});
							break;
						case 1:
							grid.setFilter(function (value,key) {
								if (value.type === 'prod')
									return value;
							});
							break;
						case 2:
							grid.setFilter(function (value,key) {
								if (value.type !== 'all')
									return value;
							});
							break;
					}
					//grid.focus();
				}
			}
		}).appendTo(this);

		var metaData = new MAF.control.MetadataDisplay({
			updateMethod: function (data) {
				this.setText('Metadata grid: ' + data.text);
			},
			styles: {
				vOffset: this.elements.tab2.outerHeight
			}
		}).appendTo(this);

		var pageindicator = new MAF.control.PageIndicator({
			threshold: 7,
			styles: {
				vOffset: this.height - 38
			}
		}).appendTo(this);

		this.elements.grid1 = new MAF.element.Grid({
			rows: 2,
			columns: 2,
			carousel: true,
			cellCreator: function () {
				var cell = new MAF.element.GridCell({
					styles: Object.merge({}, this.getCellDimensions(), {
						transform: 'translateZ(0)',
						backgroundRepeat: 'no-repeat',
						backgroundImage: 'Images/tv.png',
						backgroundPosition: 'center'
					}),
					events: {
						onSelect: function (event) {
							new MAF.dialogs.Alert({
								title: (event.payload && event.payload.dataItem) ? event.payload.dataItem.text.capitalize() : 'Cell ' + this.getCellIndex(),
								message: 'You have selected a cell in this grid.',
								buttons: [
									{ label: 'Close', callback: this.dialogCallback },
									{ label: 'Continues', callback: this.dialogCallback }
								],
								focusOnCompletion: this.grid
							}).show();
						},
						onFocus: function () {
							var coords = this.getCellCoordinates(),
								origin = [];
							if (coords.column === 0) {
								origin.push('left');
							} else if (coords.column === (coords.columns - 1)) {
								origin.push('right');
							} else {
								origin.push('center');
							}
							if (coords.row === 0) {
								origin.push('top');
							} else if (coords.row === (coords.rows - 1)) {
								origin.push('bottom');
							} else {
								origin.push('center');
							}
							this.animate({
								backgroundColor: Theme.getStyles('BaseFocus', 'backgroundColor'),
								scale: 1.1,
								origin: origin,
								duration: 0.5,
								zOrder: Animator.ZORDER
							});
						},
						onBlur: function () {
							this.animate({
								backgroundColor: null,
								scale: 1,
								zOrder: null,
								duration: 0.5,
								events: {
									onAnimationEnded: function (animator) {
										// remove animation from cell;
										animator.reset();
									}
								}
							});
						}
					}
				});

				cell.text = new MAF.element.Text({
					styles: {
						backgroundColor: 'black',
						fontSize: 24,
						color: 'white',
						width: cell.width - 20,
						height: cell.height - 20,
						hOffset: 10,
						vOffset: 10,
						anchorStyle: 'center'
					}
				}).appendTo(cell);

				return cell;
			},
			cellUpdater: function (cell, data) {
				cell.text.setText(data.text);
				switch (data.type) {
					case 'demo':
						cell.text.setStyle('backgroundColor', Theme.getStyles('BaseGlow', 'backgroundColor'));
						break;
					case 'prod':
						cell.text.setStyle('backgroundColor', Theme.getStyles('BaseActive', 'backgroundColor'));
						break;
				}
			},
			styles: {
				width: this.width,
				height: this.height - metaData.outerHeight - pageindicator.height,
				vOffset: metaData.outerHeight
			},
			events: {
				onBroadcast: function (event) {
//					log('onBroadcast', event);
				}
			}
		}).appendTo(this);

		pageindicator.attachToSource(this.elements.grid1);
		metaData.attachToSource(this.elements.grid1);
	},

	dialogCallback: function (event) {
		log('dialogCallback', event);
	},

	updateView: function () {
		this.elements.tab1.initTabs([{
			label: 'Show demo type',
			value: '1'
		},{
			label: 'Show prod type',
			value: '2'
		},{
			label: 'Show all',
			value: '3'
		}]);
		getPagingData({}, true);
	},

	focusView: function () {
		// Facebook.api(path, method, params, callback);
		Facebook.api('me', function (result) {
			log(result);
			var userId = Facebook.userId || 'me()';
			var query = JSON.stringify({
				"User": "SELECT uid, name, first_name, last_name, birthday, sex, hometown_location, work, pic_cover, pic, pic_square, pic_small, pic_big, friend_count, mutual_friend_count, likes_count, current_location, is_app_user, verified FROM user WHERE uid="+ userId,
				"Albums": "SELECT aid, owner, cover_object_id, cover_pid, name, object_id, size FROM album WHERE owner="+ userId
			});
			Facebook.api('/fql?q=' + escape(query), function (result) {
				log(result);
			});
		});
	}
});
