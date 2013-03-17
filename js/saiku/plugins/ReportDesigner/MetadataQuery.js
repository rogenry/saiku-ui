/*
 * Query.js
 *
 * Copyright (c) 2011, Marius Giepz, OSBI Ltd. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
 * MA 02110-1301  USA
 */
/**
 * Workspace query
 */
var reportDesigner = reportDesigner || {};

reportDesigner.MetadataQuery = Backbone.Model.extend({
	initialize: function(args, options) {

		_.extend(this, options);

		// Bind `this`
		_.bindAll(this, "run", "move_dimension","remove_dimension","reflect_properties", "build_sorts");

        // Generate a unique query id
        this.uuid = 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
            function (c) {
                var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            }).toUpperCase();

        // Initialize properties, action handler, and result handler
        this.action = new QueryAction({}, { query: this });
        this.result = new Result({ limit: Settings.RESULT_LIMIT }, { query: this });
		this.reportresult = new ReportResult({}, {query: this});
		this.inplace = new InplaceEdit({}, {query: this});

		this.reportPerspective = true;
		this.selectedModel = Saiku.session.sessionworkspace.mdModels[this.attributes.domainId + "/" + this.attributes.modelId];
		this.selectedItems = {}; //Store metadata descriptions of selected items

	},

    parse: function(response) {
        // Assign id so Backbone knows to PUT instead of POST
        this.id = this.uuid; //MG//???

        // Fetch initial properties from server
        if (! this.properties) {
            this.properties = new Properties({}, { query: this });
        } else {
            this.properties.fetch({
                success: this.reflect_properties
            });
        }
    },

    reflect_properties: function() {
        this.workspace.trigger('properties:loaded');
    },

	build_sorts: function($items) {
		var that = this;

		$items.each(

		function() {
			var fieldInfo = $(this).find('.dimension').attr('href').split('/');
			var categoryId = fieldInfo[1];
			var columnId = fieldInfo[3]

			var $span = $(this).find('span.sort');
			if($span.length !== 0) {
				if($span.hasClass('BASC')) {
					var sort = {
						view_id: categoryId,
						column_id: columnId,
						direction: SortType.ASC
					};
					that.workspace.metadataQuery.config.mql.orders.push(sort);
				} else if($span.hasClass('BDESC')) {
					var sort = {
						view_id: categoryId,
						column_id: columnId,
						direction: SortType.DESC
					};
					that.workspace.metadataQuery.config.mql.orders.push(sort);
				}
			}
		});
	},

	run: function(force) {

		var that = this;

		//Rebuild sorting:
		this.workspace.metadataQuery.config.mql.orders = [];

		var $measures = $(this.workspace.el).find('.measures ul li.d_measure');
		var $relgroups = $(this.workspace.el).find('.relgroups ul li.d_measure');
		var $colgroups = $(this.workspace.el).find('.colgroups ul li.d_measure');
		var $rowgroups = $(this.workspace.el).find('.rowgroups ul li.d_measure');

		if(Settings.MODE === 'crosstab') {
			this.build_sorts($rowgroups);
			this.build_sorts($colgroups);
			this.build_sorts($measures);
		} else {
			this.build_sorts($relgroups);
			this.build_sorts($measures);
		}

		if($measures.size() == 0) {
			var message = '<tr><td><span class="i18n">You need to select at least one (non-calculated) Column for a valid query.</td></tr>';
			$(this.workspace.el).find('.report_inner').html(message);
			$(this.workspace.el).find('.workspace_results div').html(message);
			return;
		}

		var mqlQueryString = this.workspace.metadataQuery.toXml();

		this.workspace.reportSpec.dataSource = new reportDesigner.Datasource({
			id: "master",
			type: DatasourceType.CDA,
			properties: {
				queryString: mqlQueryString
			}
		});

		if(!that.reportPerspective) {
			Saiku.ui.block("Rendering Table");
			that.result.fetch({
				error: function(model, response) {
					that.error = new ClientError({
						query: self,
						message: response.responseText
					});
					that.workspace.reset_canvas();
					that.workspace.trigger('FSM:ETableError');
					Saiku.ui.unblock();
				}
			});
		} else {
			Saiku.ui.block("Rendering Report");
			that.reportresult.save( {  }, 
			{
				error: function(model, response) {
					that.error = new ClientError({
						query: self,
						message: response.responseText
					});
					that.workspace.reset_canvas();
					that.workspace.trigger('FSM:EReportError');
					Saiku.ui.unblock();
				},
				success: function(model, response) {
					console.log("OK");
					console.log(response);
					return false;
				},
				contentType:  'application/json',
				data: JSON.stringify(that.workspace.reportSpec)
			});
		}
	},

    move_dimension: function(dimension, target, indexFrom, index, uuid) {
		$(this.workspace.el).find('.run').removeClass('disabled_toolbar');

		var mc;
		if(indexFrom === undefined){
			var fieldInfo = dimension.split('/');
			var categoryId = fieldInfo[1];
			var columnId = fieldInfo[3];
			mc = this.selectedModel.getColumnById(categoryId, columnId);
			this.selectedItems[uuid] = mc;
		}else{
			mc = this.selectedItems[uuid];
		}
		//if it doesnt have a metadata it must be a calculated column
		if(mc === undefined){
			if(indexFrom) {
				field = this.workspace.reportSpec.removeColumn(indexFrom);
				this.workspace.reportSpec.addColumn(field, index);
			}
			this.run();
		}


/*
		var fieldInfo = dimension.split('/');
		var categoryId = fieldInfo[1];
		var columnId = fieldInfo[3];

		if(categoryId == 'CALCULATED'){
			if(indexFrom) {
				field = this.workspace.reportSpec.removeColumn(indexFrom);
				this.workspace.reportSpec.addColumn(field, index);
			}
			this.run();
		}
*/

		var selection = {
			table: mc.category,
			column: mc.id,
			aggregation: mc.defaultAggType
		};

		switch(target) {
		case "MEASURES":
			var agg = "NONE";
			if(Settings.MODE === 'crosstab') agg = "GROUPSUM"; //TODO: what should be the default here?
			var field = new reportDesigner.FieldDefinition({
				fieldId: mc.id,
				fieldName: mc.name,
				fieldDescription: mc.description,
				aggregationFunction: agg
			});

			if(indexFrom) {
				field = this.workspace.reportSpec.removeColumn(indexFrom);
			}
			this.workspace.reportSpec.addColumn(field, index);
			break;

		case "REL_GROUPS":
			var group = new reportDesigner.GroupDefinition({
				fieldId: mc.id,
				groupName: mc.id,
				type: GroupType.RELATIONAL,
				displayName: mc.name,
				printSummary: true
			});
			if(indexFrom) {
				group = this.workspace.reportSpec.removeGroup(indexFrom);
			}
			this.workspace.reportSpec.addGroup(group, index);
			break;

		case "ROW_GROUPS":
			var group = new reportDesigner.GroupDefinition({
				fieldId: mc.id,
				groupName: mc.id,
				type: GroupType.CT_ROW,
				displayName: mc.name,
				printSummary: true
			});

			if(indexFrom) {
				group = this.workspace.reportSpec.removeGroup(indexFrom);
			}
			this.workspace.reportSpec.addGroup(group, index);
			break;

		case "COL_GROUPS":
			var group = new reportDesigner.GroupDefinition({
				fieldId: mc.id,
				groupName: mc.id,
				type: GroupType.CT_COLUMN,
				displayName: mc.name,
				printSummary: true
			});

			if(indexFrom) {
				group = this.workspace.reportSpec.removeGroup(indexFrom);
			}
			this.workspace.reportSpec.addGroup(group, index);
			break;

		case "FILTERS":
			console.log("adding Filter");

			this.workspace.metadataQuery.addConstraint({}, index);

			var filterModel = {
				index: index,
				operatorType: OperatorType.AND,
				columnMeta: mc,
				values: null,
				conditionType: ConditionType.EQUAL,
				aggType: AggregationFunction.NONE,
				parameter: null
			};

			(new SimpleFilterDialog({
				filterModel: filterModel,
				workspace: this.workspace
			})).open();

			return false;

		}

		this.workspace.metadataQuery.addSelection(selection);

		this.run();

	},

	remove_dimension: function(target, indexFrom) {
		switch(target) {
		case "MEASURES":
			this.workspace.reportSpec.removeColumn(indexFrom);
			this.workspace.metadataQuery.removeSelection(indexFrom);
			break;
		case "FILTERS":
			this.workspace.metadataQuery.removeConstraint(indexFrom);
			//Remove the filter from mql-conditions using index;
			//If mql contains a param, also remove that param from mql
			//Remove the param from the reportmodel
			//If the param has a query, remove that query from datasource
		default:
			this.workspace.reportSpec.removeGroup(indexFrom);
		}
		this.run();
	},

});

Query = reportDesigner.MetadataQuery;