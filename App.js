Ext.define('CustomApp', {
	extend: 'Rally.app.App',
	componentCls: 'app',


	_releaseId: undefined,
	_releaseDate: undefined,
	_releaseInitDate: undefined,
	_releaseEndDate: undefined,
	_stories: undefined,
	_defects: undefined,
	_orphanDefects: undefined,
	_features: undefined,


	_defaultWorkDays: 60,

	launch: function() {
		//Write app code here

		//API Docs: https://help.rallydev.com/apps/2.1/doc/



		var context = this.getContext();
		var project = context.getProject()['ObjectID'];
		this.projectId = project;

		console.log('project:', project);

		var filterPanel = Ext.create('Ext.panel.Panel', {
			layout: 'hbox',
			align: 'stretch',
			padding: 5,
			itemId: 'filterPanel',
		});


		var summaryPanel = Ext.create('Ext.panel.Panel', {
			title: 'Summary',
			layout: {
				type: 'vbox',
				align: 'stretch',
				padding: 5
			},
			padding: 5,
			itemId: 'summaryPanel',
			items : [{
				xtype:'container',
	            itemId:'notes',
	            padding: '0 0 10 0',
	            html: '* Percentage that should be complete is calculated by the total number of  work days that have elapsed by the number of work days in a release'
			}]
		});

		var mainPanel = Ext.create('Ext.panel.Panel', {
			title: 'Release Menagement Report',
			layout: {
				type: 'vbox',
				align: 'stretch',
				padding: 5
			},
			//height: 800,
			padding: 5,
			itemId: 'mainPanel'
		});

		this.myMask = new Ext.LoadMask({
			msg: 'Please wait...',
			target: this
		});


		var releaseComboBox = Ext.create('Rally.ui.combobox.ReleaseComboBox', {
			fieldLabel: 'Choose Release',
			width: 450,
			itemId: 'releasaeComboBox',
			allowClear: true,
			scope: this,
			listeners: {
				ready: function(combobox) {
					// console.log('ready: ', combobox.getRecord());
					var records = [combobox.getRecord()];
					this._releaseInitDate = combobox.getRecord().get('ReleaseStartDate');
					this._releaseEndDate = combobox.getRecord().get('ReleaseDate');


					this._setDefaultWorkDays();
					this._initReport(records);
				},
				select: function(combobox, records) {
					// console.log('comobo :', records);

					this._releaseInitDate = combobox.getRecord().get('ReleaseStartDate');
					this._releaseEndDate = combobox.getRecord().get('ReleaseDate');

					this._setDefaultWorkDays();
					this._initReport(records);
				},
				scope: this
			}
		});

		filterPanel.add(releaseComboBox);

		this.add(filterPanel);

		this.add(summaryPanel);

		this.add(mainPanel);
	},


	_setDefaultWorkDays: function() {
		var workDays = 0;

		var one_day=1000*60*60*24;

		var daysOfRelease = Math.ceil((this._releaseEndDate.getTime() - this._releaseInitDate.getTime()) / (one_day));
		console.log('release total days:', daysOfRelease);

		workDays = (daysOfRelease - ((daysOfRelease / 7) * 2))


		console.log('setting default work days:', workDays);
		this._defaultWorkDays = workDays;
	},


	_initReport: function(records) {
		// console.log('records',  records);
		

		this.myMask.show();
		var promises = [];


		for (var j = 0; j < records.length; j++) {

			var deferred = Ext.create('Deft.Deferred');

			var i = j;
			// console.log('release', records[i]);

			this._releaseId = records[i].get('ObjectID');
			this._releaseDate = records[i].get('ReleaseDate');


			this._createDataCall(records[i], deferred, this);

			promises.push(
				deferred
			);
		}

		Deft.Promise.all(promises).then({
			success: function(records) {
				//console.log('before assembling grid: ', records);

				var rows = records[0];
				var reportGrid = this._createReportGrid(rows);
				var summaryGrid = this._createSummaryGrid();

				//console.log('creating grid');
				//console.log('report store:', reportStore);

				this.down('#mainPanel').removeAll(true);
				this.down('#summaryPanel').add(summaryGrid);
				this.down('#mainPanel').add(reportGrid);

				this.myMask.hide();
			},
			scope: this
		});
	},


	_createReportGrid: function(rows) {
		var reportStore = Ext.create('Ext.data.JsonStore', {
			fields: ['projectName',
				'exploring',
				'elaborating',
				'inprogress',
				'staging',
				'done',
				'featureTotal',
				'storyPointsAccepted',
				'storyPointsInProgress',
				'storyPointsPercentCompleted',
				'defectsUnelaborated',
				'defectsDefined',
				'defectsInProgress',
				'defectsCompleted',
				'defectsAccepted',
				'defectsReadyToShip',
				'defectPointsAccepted',
				'defectPointsInProgress'

			]
		});

		reportStore.add(rows);
		//console.log('rows', rows);

		var grid = Ext.create('Ext.grid.Panel', {
			//height: 650,
			columns: [{
				text: 'Project Name',
				flex: 1,
				sortable: true,
				dataIndex: 'projectName'
			}, {
				text: 'Features',
				flex: 3,
				columns:[{
					text: 'Exploring',
					width: 75,
					sortable: true,
					dataIndex: 'exploring'
				}, {
					text: 'Elaborating',
					width: 75,
					sortable: true,
					dataIndex: 'elaborating'
				}, {
					text: 'In-Progress',
					width: 75,
					sortable: true,
					dataIndex: 'inprogress'
				}, {
					text: 'Staging',
					width: 75,
					sortable: true,
					dataIndex: 'staging'
				}, {
					text: 'Done',
					width: 75,
					sortable: true,
					dataIndex: 'done'
				}, {
					text: 'Total of Features',
					width: 80,
					sortable: true,
					dataIndex: 'featureTotal'
				}]
			}, {
				text: 'Stories',
				flex: 2,
				columns:[{
					text: 'Story Points Accepted',
					// width: 120,
					sortable: true,
					dataIndex: 'storyPointsAccepted'
				}, {
					text: 'Story Points In-Progress',
					// width: 130,
					sortable: true,
					dataIndex: 'storyPointsInProgress'
				}, {
					text: 'Percent Story Points Completed',
					// width: 170,
					sortable: true,
					dataIndex: 'storyPointsPercentCompleted'
				}]
			}, {
				text: 'Defects',
				flex: 4,
				columns:[{
					text: 'Unelaborated',
					width: 85,
					sortable: true,
					dataIndex: 'defectsUnelaborated'
				}, {
					text: 'Defined',
					width: 55,
					sortable: true,
					dataIndex: 'defectsDefined'
				}, {
					text: 'In-Progress',
					width: 65,
					sortable: true,
					dataIndex: 'defectsInProgress'
				}, {
					text: 'Completed',
					width: 65,
					sortable: true,
					dataIndex: 'defectsCompleted'
				}, {
					text: 'Accepted',
					width: 65,
					sortable: true,
					dataIndex: 'defectsAccepted'
				}, {
					text: 'Read to Ship',
					width: 70,
					sortable: true,
					dataIndex: 'defectsReadyToShip'
				}, {
					text: 'Defect Points Accepted',
					width: 120,
					sortable: true,
					dataIndex: 'defectPointsAccepted'
				}, {
					text: 'Defect Points In-Progress',
					width: 130,
					sortable: true,
					dataIndex: 'defectPointsInProgress'
				}]
			}],
			flex: 1,
			//title: 'Release: ' + releaseName,
			store: reportStore
		});

		return grid;
	},


	_createSummaryGrid: function() {
		var summaryStore = Ext.create('Ext.data.JsonStore', {
			fields: ['daysRemaining',
				'workingDaysRemaining',
				'totalStoryPoints',
				'totalStoryPointsAccepted',
				'totalDefectPoints',
				'totalDefectPointsAccepted',
				'totalFeaturePoints',
				'totalFeaturePointsCompleted',
				'percentageComplete',
				'percentageShouldBeCompleted'
			]
		});

		var releaseDate = this._releaseDate;
		var today = new Date();
		var one_day=1000*60*60*24;

		var daysRemaining = Math.ceil((releaseDate.getTime() - today.getTime()) / (one_day));
		var workingDaysRemaining = daysRemaining - (Math.ceil(daysRemaining / 7) * 2);
		//console.log(today, releaseDate, daysRemaining);

		var totalStoryPoints = 0;
		var totalStoryPointsAccepted = 0;
		var totalDefectPoints = 0;
		var totalDefectPointsAccepted = 0;
		var totalFeaturePoints = 0;
		var totalFeaturePointsCompleted = 0;
		var percentageComplete = 0;
		var percentageShouldBeCompleted = 0;



		_.each(this._stories, function(story) {
			totalStoryPoints += story.get('PlanEstimate');

			if ((story.get('ScheduleState') === 'Accepted') || (story.get('ScheduleState') === 'Ready to Ship')){
				totalStoryPointsAccepted += story.get('PlanEstimate');
			}
		});


		_.each(this._defects, function(defect) {
			totalDefectPoints += defect.get('PlanEstimate');

			if ((defect.get('ScheduleState') === 'Accepted') || (defect.get('ScheduleState') === 'Ready to Ship')){
				totalDefectPointsAccepted += defect.get('PlanEstimate');
			}
		});


		_.each(this._orphanDefects, function(defect) {
			totalDefectPoints += defect.get('PlanEstimate');

			if ((defect.get('ScheduleState') === 'Accepted') || (defect.get('ScheduleState') === 'Ready to Ship')){
				totalDefectPointsAccepted += defect.get('PlanEstimate');
			}
		});


		_.each(this._features, function(feature) {
			var state = feature.get('State');
			totalFeaturePoints += feature.get('PreliminaryEstimateValue');

			if (state && (state.Name === 'Staging' || state.Name === 'Done') ) {
				totalFeaturePointsCompleted += feature.get('PreliminaryEstimateValue');
			}
		});


		percentageComplete = ( ((totalStoryPointsAccepted + totalDefectPointsAccepted) / (totalStoryPoints + totalDefectPoints)) * 100).toFixed(2) + '%';

		//60 – number of work days remaining)/60
		percentageShouldBeCompleted = ( 100 * ((this._defaultWorkDays - workingDaysRemaining) / this._defaultWorkDays) ).toFixed(2) + '%';
		//percentageShouldBeCompleted = ( (totalStoryPoints + totalDefectPoints) * (1 - (daysRemaining / 60)) ).toFixed(2) + '%';

		var row = [];

		var summary = {
			daysRemaining: daysRemaining,
			workingDaysRemaining: workingDaysRemaining,
			totalStoryPoints: totalStoryPoints,
			totalStoryPointsAccepted: totalStoryPointsAccepted,
			totalDefectPoints: totalDefectPoints,
			totalDefectPointsAccepted: totalDefectPointsAccepted,
			totalFeaturePoints: totalFeaturePoints,
			totalFeaturePointsCompleted: totalFeaturePointsCompleted,
			percentageComplete: percentageComplete,
			percentageShouldBeCompleted: percentageShouldBeCompleted
		};

		row.push(summary);
		summaryStore.add(row);


		var grid = Ext.create('Ext.grid.Panel', {
			//height: 650,			
			columns:[{
				text: 'Days Remaining',
				sortable: true,
				flex: 1,
				dataIndex: 'daysRemaining'
			}, {
				text: 'Working Days Remaining',
				sortable: true,
				flex: 1,
				dataIndex: 'workingDaysRemaining'
			}, {
				text: 'Total Story Points',
				sortable: true,
				flex: 1,
				dataIndex: 'totalStoryPoints'
			}, {
				text: 'Total Story Points Accepted',
				sortable: true,
				flex: 1,
				dataIndex: 'totalStoryPointsAccepted'
			}, {
				text: 'Total Defect Points',
				sortable: true,
				flex: 1,
				dataIndex: 'totalDefectPoints'
			}, {
				text: 'Total Defect Points Accepted',
				sortable: true,
				flex: 1,
				dataIndex: 'totalDefectPointsAccepted'
			}, {
				text: 'Total Feature Points',
				sortable: true,
				flex: 1,
				dataIndex: 'totalFeaturePoints'
			}, {
				text: 'Total Feature Points Completed',
				sortable: true,
				flex: 1,
				dataIndex: 'totalFeaturePointsCompleted'
			}, {
				text: 'Percentage Completed',
				sortable: true,
				flex: 1,
				dataIndex: 'percentageComplete',
				renderer : function(value, meta, record) {
				    if (parseFloat(value) > parseFloat(record.get('percentageShouldBeCompleted'))) {
				        meta.style = "background-color:#cdf9c2;";
				    } else {
				        meta.style = "background-color:#ffe2e2;";
				    }
				    return value;
				}
			}, {
				text: 'Percentage That Should Be Completed',
				flex: 1,
				sortable: true,
				dataIndex: 'percentageShouldBeCompleted'
			}],
			flex: 1,
			//title: 'Release: ' + releaseName,
			store: summaryStore
		});

		return grid;
	},


	_createDataCall: function(release, deferred, that) {
		function DataCall() {
			this.releaseName = release.get('Name');
			this.releaseId = release.get('ObjectID');
			this.deferred = deferred;
			this.that = that;

			var context = that.getContext();
			this.projectId = context.getProject()['ObjectID'];

			this.execute = function() {
				// console.log('executing call:', release);

				// load features for this release

				this._loadOrphanDefects(this.releaseName, this.projectId).then({
					success: function(records) {
						// console.log('orphan:', records);
						this.orphanDefects = records;
						that._orphanDefects = records;
						return this._loadFeatures(this.releaseName);
					},
					scope: this
				}).then({
					success: function(records) {
						this.features = _.flatten(records);
						that._features = this.features;
						return this._loadStories(records);
					},
					scope: this
				}).then({
		            success: function(records) {
		            	// console.log('success stories:', records);
		            	this.stories = _.flatten(records);
		            	that._stories = this.stories;
		            	return this._loadDefects(records);
		            },
		            scope: this
		        }).then({
		        	success: function(records) {
		        		// console.log('success defects:', records);
		        		this.defects = _.flatten(records);
		        		that._defects = this.defects;

		        		//console.log('features', this.features);
		        		//console.log('stories', this.stories);
		        		//console.log('defects', this.defects);
		        		//console.log('orphan defects', this.orphanDefects);

		        		var map = that._createProjectMap(this.features, this.stories, this.defects, this.orphanDefects);
		        		//console.log('map', map);

		        		var rows = [];
		        		map.eachKey(function(projectName, artifacts) {
		        			rows.push(that._createRow(projectName, artifacts));
		        		});

		        		deferred.resolve(rows);
		        	}, scope: this
		        });
			},


			this._loadFeatures = function(releaseName) {
				// console.log('Loading features for release:', releaseName);

				var featureStore = Ext.create('Rally.data.wsapi.artifact.Store', {
					context: {
				        projectScopeUp: false,
				        projectScopeDown: true,
				        project: '/project/'+ this.projectId //null to search all workspace
				    },
					models: ['PortfolioItem/Feature'],
					fetch: ['FormattedID', 'Name', 'ObjectID', 'PreliminaryEstimate', 'PreliminaryEstimateValue', 'Project', 'State', 'Type', 'UserStories'],
					filters: [{
						property: 'Release.Name',
						operator: '=',
						value: releaseName
					}],
					limit: Infinity
				});

				return featureStore.load();
			},


			this._loadStories = function(features) {
				// console.log('Features before loading stories:', features);

				var promises = [];

            	_.each(features, function(feature) {
            		var stories = feature.get('UserStories');

					if (stories.Count > 0) {
						stories.store = feature.getCollection('UserStories',{
							fetch: [
								'FormattedID', 
								'Name', 
								'ObjectID', 
								'Children', 
								'Defects', 
								'ScheduleState', 
								'Project', 
								'PlanEstimate',
								'Type',]
						});

						promises.push(stories.store.load());

					}
				});

				return Deft.Promise.all(promises);
			},


			this._loadDefects = function(stories) {
				stories = _.flatten(stories);
				// console.log('Stories before loading defects:', stories);

				var promises = [];

            	_.each(stories, function(story) {
            		var defects = story.get('Defects');
					if (defects.Count > 0) {
						defects.store = story.getCollection('Defects',{
							fetch: [
								'FormattedID', 
								'Name', 
								'ObjectID', 
								'ScheduleState', 
								'Project', 
								'PlanEstimate', 
								'Blocked', 
								'Type', 
								'Parent']
						});

						promises.push(defects.store.load());
					}
				});

				return Deft.Promise.all(promises);
			},


			this._loadOrphanDefects = function(releaseName, projectId) {
				// console.log('Loading orphan defects for release:', releaseName);

				var featureStore = Ext.create('Rally.data.wsapi.artifact.Store', {
					context: {
				        projectScopeUp: false,
				        projectScopeDown: true,
				        project: /project/+projectId //null to search all workspace
				    },
					models: ['Defect'],
					fetch: ['FormattedID', 'Name', 'ObjectID', 'Project', 'PlanEstimate', 'ScheduleState', 'Type', 'Blocked', 'Parent'],
					filters: [{
						property: 'Release.Name',
						operator: '=',
						value: releaseName
					}],
					limit: Infinity
				});

				return featureStore.load();
			}
		}

		var data = new DataCall(release, deferred, that);
		data.execute();
	},


	_createProjectMap: function(features, stories, defects, orphanDefects) {
		var map = new Ext.util.MixedCollection();

		_.each(features, function(feature) {
			var projectName = feature.get('Project').Name;
			if (!map.containsKey(projectName)) {
				var artifacts = [];
				artifacts.push(feature);
				map.add(projectName, artifacts);
			} else {
				map.get(projectName).push(feature);
			}
		});

		_.each(stories, function(story) {
			var projectName = story.get('Project').Name;
			if (!map.containsKey(projectName)) {
				var artifacts = [];
				artifacts.push(story);
				map.add(projectName, artifacts);
			} else {
				map.get(projectName).push(story);
			}
		});

		_.each(defects, function(defect) {
			var projectName = defect.get('Project').Name;
			if (!map.containsKey(projectName)) {
				var artifacts = [];
				artifacts.push(defect);
				map.add(projectName, artifacts);
			} else {
				map.get(projectName).push(defect);
			}
		});

		_.each(orphanDefects, function(defect) {
			var projectName = defect.get('Project').Name;
			if (!map.containsKey(projectName)) {
				var artifacts = [];
				artifacts.push(defect);
				map.add(projectName, artifacts);
			} else {
				map.get(projectName).push(defect);
			}
		});

		return map;
	},


	_createRow:function(projectName, artifacts)  {
		var exploring = 0;
		var elaborating = 0;
		var inprogress = 0;
		var staging = 0;
		var done = 0;
		var featureTotal = 0;

		var storyPointsAccepted = 0;
		var storyPointsInProgress = 0;
		var storyPointsPercentCompleted = 0;
		var storyTotal = 0;


		var defectsUnelaborated = 0;
		var defectsDefined = 0;
		var defectsInProgress = 0;
		var defectsCompleted = 0;
		var defectsAccepted = 0;
		var defectsReadyToShip = 0;
		var defectPointsAccepted = 0;
		var defectPointsInProgress = 0;


		_.each(artifacts, function(artifact) {
			//console.log(artifact.get('_type'));

			//feature by state
			if (artifact.get('_type') == 'portfolioitem/feature') {

				if (artifact.get('State') != null) {
					//console.log('State:', artifact.get('State').Name);

					if (artifact.get('State').Name == 'Exploring') {
						exploring += 1;
					} else if (artifact.get('State').Name == 'Elaborating') {
						elaborating +=1;
					} else if (artifact.get('State').Name == 'In-Progress') {
						inprogress +=1;
					} else if (artifact.get('State').Name == 'Staging') {
						staging +=1;
					} else if (artifact.get('State').Name == 'Done') {
						done +=1;
					}
					featureTotal +=1;
				}
			}

			if (artifact.get('_type') == 'hierarchicalrequirement') {
				if ((artifact.get('ScheduleState') == 'Accepted') || (artifact.get('ScheduleState') == 'Ready to Ship')){
					storyPointsAccepted += artifact.get('PlanEstimate');
				} else if ((artifact.get('ScheduleState') != 'Accepted') && (artifact.get('ScheduleState') != 'Ready to Ship')) {
					storyPointsInProgress += artifact.get('PlanEstimate');
				}
				storyTotal += artifact.get('PlanEstimate');
			}


			if (artifact.get('_type') == 'defect') {
				if (artifact.get('ScheduleState') == 'Unelaborated') {
					defectsUnelaborated += 1;
				} else if (artifact.get('ScheduleState') == 'Defined') {
					defectsDefined +=1;
					defectPointsInProgress += artifact.get('PlanEstimate');
				} else if (artifact.get('ScheduleState') == 'In-Progress') {
					defectsInProgress +=1;
					defectPointsInProgress += artifact.get('PlanEstimate');
				} else if (artifact.get('ScheduleState') == 'Completed') {
					defectsCompleted +=1;
				} else if (artifact.get('ScheduleState') == 'Accepted') {
					defectsAccepted +=1;
					defectPointsAccepted += artifact.get('PlanEstimate');
				} else if (artifact.get('ScheduleState') == 'Ready to Ship') {
					defectsReadyToShip +=1;
				}
			}
		});

		if (storyTotal != 0) {
			storyPointsPercentCompleted = Math.floor((storyPointsAccepted / storyTotal) * 100) + '%';
		}

		// console.log('Exploring total:', exploring);
		// console.log('Elaborating total:', elaborating);
		// console.log('In-Progress total:', inprogress);
		// console.log('Staging total:', staging);
		// console.log('Done total:', done);
		// console.log(' total:', featureTotal);

		var row = {
			projectName: projectName,
			exploring: exploring,
			elaborating: elaborating,
			inprogress: inprogress,
			staging: staging,
			done: done,
			featureTotal: featureTotal,
			storyPointsAccepted: storyPointsAccepted,
			storyPointsInProgress: storyPointsInProgress,
			storyPointsPercentCompleted: storyPointsPercentCompleted,
			defectsUnelaborated: defectsUnelaborated,
			defectsDefined: defectsDefined,
			defectsInProgress: defectsInProgress,
			defectsCompleted: defectsCompleted,
			defectsAccepted: defectsAccepted,
			defectsReadyToShip: defectsReadyToShip,
			defectPointsAccepted: defectPointsAccepted,
			defectPointsInProgress: defectPointsInProgress
		};

		//console.log('project row:', row);

		return row;
	}
});