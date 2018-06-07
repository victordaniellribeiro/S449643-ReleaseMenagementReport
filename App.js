Ext.define('CustomApp', {
	extend: 'Rally.app.App',
	componentCls: 'app',
	launch: function() {
		//Write app code here

		//API Docs: https://help.rallydev.com/apps/2.1/doc/



		var context = this.getContext();
		var project = context.getProject()['ObjectID'];

		console.log('project:', project);

		var filterPanel = Ext.create('Ext.panel.Panel', {
			layout: 'hbox',
			align: 'stretch',
			padding: 5,
			itemId: 'filterPanel',
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
			itemId: 'mainPanel',
		});

		this.myMask = new Ext.LoadMask({
			msg: 'Please wait...',
			target: mainPanel
		});


		var milestoneComboBox = Ext.create('Rally.ui.combobox.MilestoneComboBox', {
			fieldLabel: 'Choose Milestone',
			width: 250,
			itemId: 'milestoneComboBox',
			allowClear: true,
			scope: this,
			listeners: {
				ready: function(combobox) {
					console.log('ready: ', combobox);
				},
				select: function(combobox, records) {
					console.log('comobo :', records);

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

					this.myMask.show();
					var promises = [];


					for (var j = 0; j < records.length; j++) {

						var deferred = Ext.create('Deft.Deferred');

						var i = j;
						var milestoneId = records[i].get('ObjectID');
						this._createDataCall(records[i], deferred, this);

						promises.push(
							deferred
						);
					}

					Deft.Promise.all(promises).then({
						success: function(records) {
							//console.log('before assembling grid: ', records[0]);

							reportStore.add(records[0]);

							console.log('creating grid');
							console.log('report store:', reportStore);

							var grid = Ext.create('Ext.grid.Panel', {
								height: 650,
								columns: [{
									text: 'Project Name',
									flex: 1,
									sortable: true,
									dataIndex: 'projectName'
								}, {
									text: 'Features',
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
										width: 100,
										sortable: true,
										dataIndex: 'featureTotal'
									}]									
								}, {
									text: 'Stories',
									columns:[{
										text: 'Story Points Accepted',
										width: 120,
										sortable: true,
										dataIndex: 'storyPointsAccepted'
									}, {
										text: 'Story Points In-Progress',
										width: 130,
										sortable: true,
										dataIndex: 'storyPointsInProgress'
									}, {
										text: 'Percent Story Points Completed',
										width: 170,
										sortable: true,
										dataIndex: 'storyPointsPercentCompleted'
									}]
								}, {
									text: 'Defects',
									columns:[{
										text: 'Unelaborated',
										width: 80,
										sortable: true,
										dataIndex: 'defectsUnelaborated'
									}, {
										text: 'Defined',
										width: 70,
										sortable: true,
										dataIndex: 'defectsDefined'
									}, {
										text: 'In-Progress',
										width: 75,
										sortable: true,
										dataIndex: 'defectsInProgress'
									}, {
										text: 'Completed',
										width: 75,
										sortable: true,
										dataIndex: 'defectsCompleted'
									}, {
										text: 'Accepted',
										width: 75,
										sortable: true,
										dataIndex: 'defectsAccepted'
									}, {
										text: 'Read to Ship',
										width: 80,
										sortable: true,
										dataIndex: 'defectsReadyToShip'
									}, {
										text: 'Defect Points Accepted',
										width: 130,
										sortable: true,
										dataIndex: 'defectPointsAccepted'
									}, {
										text: 'Defect Points In-Progress',
										width: 150,
										sortable: true,
										dataIndex: 'defectPointsInProgress'
									}]
								}],
								flex: 1,
								//title: 'Release: ' + releaseName,
								store: reportStore
							});

							this.down('#mainPanel').removeAll(true);
							this.down('#mainPanel').add(grid);

							this.myMask.hide();
						},
						scope: this
					});
				},
				scope: this
			}
		});

		filterPanel.add(milestoneComboBox);

		this.add(filterPanel);

		this.add(mainPanel);
	},


	_createFeatureCall: function(projectId, projectName, deferred, that) {
		function FeatureCall() {
			this.deferred = deferred;
			this.that = that;

			this.execute = function() {
				console.log('executing feature call', projectId);

				this._loadFeatures(projectId);				
				
			},

			this._loadFeatures = function(projectId) {
				console.log('loading stories and defects for project:', projectId);

				var featureStore = Ext.create('Rally.data.wsapi.artifact.Store', {
					models: ['PortfolioItem/Feature', 'Defect', 'UserStory'],
					fetch: ['FormattedID', 'Name', 'ObjectID', 'ScheduleState', 'PlanEstimate', 'Blocked', 'State', 'Type'],
					filters: [{
						property: 'Project.ObjectID',
						operator: '=',
						value: projectId
					}],
					limit: Infinity
				});

				featureStore.load().then({
					success: function(records) {
						this.features = records;
						console.log('Features:', records);

						var row = this._createRow(projectName, records);
						deferred.resolve(row);

					},
					scope: this
				});
				return deferred.promise;
			},

			this._createRow = function(projectName, artifacts)  {
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
						if (artifact.get('ScheduleState') == 'Accepted') {
							storyPointsAccepted += artifact.get('PlanEstimate');
						} else if (artifact.get('ScheduleState') == 'Defined' || artifact.get('ScheduleState') == 'In-Progress') {
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
					storyPointsPercentCompleted = Math.floor((storyPointsInProgress / storyTotal) * 100) + '%';
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

				console.log('project row:', row);

				return row;
			};
		}

		var data = new FeatureCall(projectId, deferred, that);
		data.execute();
	},



	_createDataCall: function(milestone, deferred, that) {
		function DataCall() {
			this.milestoneName = milestone.get('Name');
			this.milestoneId = milestone.get('ObjectID');
			this.deferred = deferred;
			this.that = that;

			this.execute = function() {
				console.log('executing call:', milestone);

				// load projects
				// for each project load its features

				this._loadProjects(milestone).then({
					success: function(projects) {
						console.log('projects loaded');
						//return this._loadFeatures(projects);
					}, scope: this
				});
			},


			this._loadProjects = function(milestone) {
				console.log('loading projects for milestone:', milestone);

				var projects = milestone.getCollection('Projects',{
					fetch: ['Name', 'ObjectID', 'Children']					
				});

				projects.load({
					callback: function(records, operation, success) {
						console.log('projects loaded:', records);
						var promises = [];

						_.each(records, function(record) {
							if (record.get('Children').Count == 0) {
								var deferredFeature = Ext.create('Deft.Deferred');
								var projectId = record.get('ObjectID');
								var projectName = record.get('Name');

								console.log();

								that._createFeatureCall(projectId, projectName, deferredFeature, this);

								promises.push(
									deferredFeature
								);
							}							
		                });

		                Deft.Promise.all(promises).then( {
		                	//here we have all the features loaded
							success: function(records) {

								console.log('end promises - feature:', records);
								deferred.resolve(records);
							},
							scope:this
						});

					},
					scope: this
				});

				return deferred.promise;
			};
		}

		var data = new DataCall(milestone, deferred, that);
		data.execute();
	}
});