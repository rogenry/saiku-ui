/*
 * WorkspaceToolbar.js
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
 * The workspace toolbar, and associated actions
 * 
 * This is the inner toolbar for each sub-query.
 * It has buttons like:
 * - ????
 * 
 * 
*/
var reportDesigner = reportDesigner || {};

reportDesigner.WorkspaceToolbar = WorkspaceToolbar.extend({
    enabled: false,
    events: {
        'click a': 'call',
        'change select' : 'changed_rowlimit',
        'change input' : 'changed_distinct'
	},

    initialize: function(args) {
        
        this._super("initialize", arguments);

         _.bindAll(this, "call", "changed_rowlimit", "changed_distinct", "reflect_properties", "run_query", "toggle_report", "calculated_column");

    },

    activate_buttons: function(args) {
        if (args.data && args.data.length > 0) {
            $(args.workspace.toolbar.el).find('.button')
                .removeClass('disabled_toolbar');            
        } else {
            $(args.workspace.toolbar.el).find('.button')
                .addClass('disabled_toolbar');
            $(args.workspace.toolbar.el)
                .find('.auto,.formula,.toggle_fields,.toggle_sidebar, .export_xls, .export_pdf, .export_csv,.cda,.prpt, .view, .report')
                .removeClass('disabled_toolbar');
        }
    },
    
    template: function() {
       return _.template($("#template-reportdesigner-workspace-toolbar").html())();
    },

	changed_rowlimit: function(event){
        this.workspace.metadataQuery.config.mql.options.limit = $(event.target).val();
        this.workspace.query.run(true);
	},

	changed_distinct: function(event){
        //that.workspace.query.page=null; <- need to do something like that?
		this.workspace.metadataQuery.config.mql.options.disable_distinct = $(event.target).is(':checked').toString();
        this.workspace.query.run(true);
	},

    toggle_report: function(event) {
		this.workspace.trigger('FSM:EToggle');
    },

    reflect_properties: function() {
        var properties = this.workspace.query.properties ?
            this.workspace.query.properties.properties : Settings.QUERY_PROPERTIES;
            
        // Set properties appropriately
        if (properties['saiku.adhoc.query.automatic_execution'] === 'true') {
            $(this.el).find('.auto').addClass('on');
        }
    },

    automatic_execution: function(event) {
        // Change property
        this.workspace.query.properties
            .toggle('saiku.adhoc.query.automatic_execution').update();
        
        // Toggle state of button
        $(event.target).toggleClass('on');
    },
 
/*  TODO: Can we merge that somehow?  
    toggle_fields: function(event) {

		var $fields = $(this.workspace.el).find('.workspace_fields')

        $fields.toggle();

        var fieldsHeight = 0;

        if($fields.is(":visible")){
        	fieldsHeight = $fields.height() + 112; 	
        }
     
      	var height = $(document).height() - $("#header").height() -
			$(this.el).find('.workspace-report-toolbar').height() -
			$(this.el).find('.workspace_toolbar').height() - fieldsHeight - 100;

		$(this.workspace.el).find('.report_inner').css({
			height: height
		});

    },
 */

   setup_report: function(event) {
   	    (new ReportSetupModal({
            workspace: this.workspace
        })).open();     
    },
   
   add_union: function(event) {
        alert("Union Queries are not yet implemented, sorry!");
    },
   
   add_join: function(event) {
        alert("Joined Queries are not yet implemented, sorry!");
    },

   calculated_column: function(event) {
   	
   	     // Launch column config dialog
        (new CalculatedColumnConfigModal({
            index: -1,
            name: 'calculated',
            key: 'CATEGORY/CALCULATED/COLUMN/NEW',
            workspace: this.workspace
        })).open();

    },    
 
    export_xls: function(event) {
        window.location = Settings.REST_URL +
            "/export/" + this.workspace.query.uuid + "/xls";
    },
    
    export_csv: function(event) {
        window.location = Settings.REST_URL +
            "/export/" + this.workspace.query.uuid + "/csv";
    },

    export_pdf: function(event) {
        var data = encodeURI(JSON.stringify(this.workspace.reportSpec));
        var inputs ='<input type="hidden" name="json" value="'+ data +'" accept-charset="utf-8"/>'; 
        var url = Settings.REPORTING_REST_MOUNT_POINT + "/generator/pdf";

        $('<form action="'+ url +'" method="post" target="_new" class="hidden">'+inputs+'</form>')
        .appendTo('body').submit().remove();

    },

    export_cda: function(event) {
        (new ExportFileModal({
            workspace: this.workspace,
            extension: "CDA"
        })).open();   
    },    

    export_prpt: function(event) {
        (new ExportPrptModal({
            workspace: this.workspace,
            extension: "PRPT"
        })).open();   
    } 

});

WorkspaceToolbar = reportDesigner.WorkspaceToolbar;
