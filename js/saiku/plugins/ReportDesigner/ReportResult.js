/*
 * ReportResult.js
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
 * Holds the resultset for a query, and notifies plugins when resultset updated
 */
var reportDesigner = reportDesigner || {};

var ReportResult = Backbone.Model.extend({
	initialize: function(args, options) {
		// Keep reference to query
		this.query = options.query;

	},
	parse: function(response) {

		this.query.workspace.trigger('FSM:EReportResult');

		this.query.workspace.trigger('report:result', {
			workspace: this.query.workspace,
			data: response
		});

		// Show the UI if hidden
		Saiku.ui.unblock();

	},
	url: function() {
		var template = this.query.template!=null ? this.query.template : "default";
		var page = this.query.page!=null ? this.query.page : "1";
		return encodeURI("generator" + "/webreport/" + page) + "?nocache="+new Date();
	}

/* ,
	fetch: function (options) {
         options.cache = false;
		 options.type = 'POST';
		 options.contentType =  'application/json'; 
		 //options.data = JSON.stringify(testmodel);
		 var test = this.query.reportSpec;
		 var stringTest = JSON.stringify(test);
		 options.data = JSON.stringify(this.query.reportSpec);
         return Backbone.Model.prototype.fetch.call(this, options);
     }
*/
 });

var FilterResult = Backbone.Model.extend({

    result: null,

    parse: function(response) {
        this.result = response;
    },

    url: function() {
    	return encodeURI("generator/filtervalues");
    }

});

reportDesigner.SavedQuery = SavedQuery.extend({
    
    url: function() {
        var u =  encodeURI("generator/resource");  
        return u;
    },

    move_query_to_workspace: function(model, response) {
    	console.log("moving query to workspace");

    	/*
        var file = response;
        var filename = model.get('file');
        for (var key in Settings) {
            if (key.match("^PARAM")=="PARAM") {
                var variable = key.substring("PARAM".length, key.length);
                var Re = new RegExp("\\$\\{" + variable + "\\}","g");
                var Re2 = new RegExp("\\$\\{" + variable.toLowerCase() + "\\}","g");
                file = file.replace(Re,Settings[key]);
                file = file.replace(Re2,Settings[key]);
                
            }
        }
        var query = new Query({ 
            xml: file,
            formatter: Settings.CELLSET_FORMATTER
        },{
            name: filename
        });
        */

        var jsonResponse = JSON.parse(response);
        var xmlResponse = reportDesigner.mql.Phomp.mqlToJs(jsonResponse.dataSource.queryString);

        /*var parser=new DOMParser();
        var qXml = parser.parseFromString(jsonResponse.dataSource.queryString,'text/xml');

        var domainID = qXml.getElementsByTagName('domain_id');
        var modelID = qXml.getElementsByTagName('model_id');
        */

        var mqlReport = new Query({
            domainId: xmlResponse.mql.domain_id,
            modelId: xmlResponse.mql.model_id
        });

        // these are the new client models
        mqlReport.reportSpec = new reportDesigner.ReportSpecification(jsonResponse);
        mqlReport.serverReportSpec = null;

        mqlReport.metadataQuery.config = xmlResponse;

        var tab = Saiku.tabs.add(new Workspace({ query: mqlReport }));
        tab.content.populate_selections();
        
    }

});

SavedQuery = reportDesigner.SavedQuery;

