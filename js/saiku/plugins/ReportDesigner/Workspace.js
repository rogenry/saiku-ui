var reportDesigner = reportDesigner || {};

reportDesigner.Workspace = Workspace.extend({

    initialize: function(args, options) {

        this.mode = "crosstab";

        //this.mode = this.options.mode;

        this._super("initialize", args);

        this.report = new ReportDesigner({
            workspace: this
        });

    },

    render: function(){

        this._super("render", arguments);

        // Add results report
        //$(this.el).find('.workspace-report-toolbar').append(_.template($("#report-toolbar").html())());
        $(this.el).find('.workspace_report_canvas').append($(this.report.el));

        //TODO: add report editpanel here
        this.edit_panel = new ElementFormatPanel({
            workspace: this,
            el: $(this.el).find('#format_toolbox')
        });
        this.edit_panel.render();
    },

/*
    template: function() {
        var template = $("#template-workspace").html() || "";
        return _.template(template)({
            cube_navigation: Saiku.session.sessionworkspace.cube_navigation
        });
    },

*/

    new_query: function() {

        // Delete the existing query
        if(this.query) {
            this.query.destroy();
        }

        // Initialize the new query
        this.selected_model = $(this.el).find('.cubes').val();

        var mModelInfo = this.selected_model;

        var parsedModelInfo = this.selected_model.split('/');
        var domainName = parsedModelInfo[0];
        var modelId = parsedModelInfo[1];

        this.query = new Query({
            domainId: domainName,
            modelId: modelId
        }, {
            workspace: this
        });

        // these are the new client models
        this.reportSpec = new reportDesigner.ReportSpecification({
            reportName: "myreport"
        });
        this.serverReportSpec = null;
        this.metadataQuery = new reportDesigner.mql.Query({
            mql: {
                domain_id: domainName.replace("%2F", "/"),
                model_id: modelId
            }
        });

        this.init_query();
    },

    init_query: function() {

        if(this.query.get('json')) {
            var json = JSON.parse(this.query.get('json'));
            this.selected_model = json.clientModelSelection;
        }

        // Find the selected cube
        if(this.selected_model === undefined) {
            this.selected_model = this.query.get('model');

        }

        $(this.el).find('.mdModels').val(this.selected_model);

        // Clear workspace
        this.clear();

        if(this.selected_model) {

            // Create new DimensionList and MeasureList
            this.mdmodel_list = new MdModelList({
                workspace: this,
                mdModel: Saiku.session.sessionworkspace.mdModels[this.selected_model]
            });
            $(this.el).find('.dimension_tree').html('').append($(this.mdmodel_list.el));

        } else {
            // Someone literally selected "Select a model"
            $(this.el).find('.dimension_tree').html('');
            return;
        }

        this.populate_selections();

    },
    populate_selections: function() {

        //I only get past here once
        //i have to check wether the query has some loaded json model from the server
        if(this.query.get('json')) {
            var model = JSON.parse(this.query.get('json'));
        }

        if(model) {

            if(model.maxClientSeq != null) {
                this.idCounter = model.maxClientSeq;
            }

            var columns = model.columns ? model.columns : false;

            var groups = model.groups ? model.groups : false;

            var parameters = model.parameters ? model.parameters : false;

            if(columns) {
                var $selections = $(this.el).find('.columns ul');

                for(var columns_iter = 0; columns_iter < columns.length; columns_iter++) {
                    var column = columns[columns_iter];
                    var name = column.name;

                    var href = '#CATEGORY/' + column.category + '/COLUMN/' + column.id;

                    var $logicalColumn = $(this.el).find('.category_tree')
                    //.find('a[title="' + name + '"]')
                    .find('a[href="' + href + '"]').parent();

                    var $clone = $logicalColumn.clone().addClass('d_dimension').appendTo($selections);

                    $("<span />").addClass('sort').addClass(column.sort.toLowerCase()).prependTo($clone);

                    if(column.formula != null) {
                        var $logicalColumn = $(this.el).find('.category_tree').find('a[title="calc_column"]').parent();

                        var $clone = $logicalColumn.clone().addClass('d_measure').addClass('.calculated').attr("id", column.uid).removeClass('hide');

                        var href = '#CATEGORY/' + column.category + '/COLUMN/' + column.name;

                        $clone.find('a[title="calc_column"]').attr("title", column.name).html(column.name).attr("href", href);

                        $clone.appendTo($selections);
                    }

                }
            }

            if(groups) {
                var $groups = $(this.el).find('.group ul');

                for(var groups_iter = 0; groups_iter < groups.length; groups_iter++) {
                    var group = groups[groups_iter];
                    var name = group.columnName;

                    var $logicalColumn = $(this.el).find('.category_tree').find('a[title="' + name + '"]').parent();

                    var $clone = $logicalColumn.clone().addClass('d_dimension').appendTo($groups);

                    $("<span />").addClass('sort').addClass(group.sort.toLowerCase()).prependTo($clone);
                }
            }

            if(parameters) {
                var $filters = $(this.el).find('.filter ul');

                for(var filters_iter = 0; filters_iter < parameters.length; filters_iter++) {
                    var filter = parameters[filters_iter];
                    var name = filter.name;

                    var $logicalColumn = $(this.el).find('.category_tree').find('a[title="' + name + '"]').parent();

                    var $clone = $logicalColumn.clone().addClass('d_dimension').appendTo($filters);

                    $("<span />").addClass('sprite').prependTo($clone);
                }
            }

            this.query.page = null;
            this.query.run();
        }

        // Make sure appropriate workspace buttons are enabled
        this.trigger('query:new', {
            workspace: this
        });

        //FSM
        this.trigger('FSM:ENew');

        // Update caption when saved
        this.query.bind('query:save', this.update_caption);
    },

    clear: function() {
		// Adjust the dimensions of the report workspace 
		$(this.el).find('.workspace_report').css({
			height: $("body").height() - $("#header").height() - $(this.el).find('.workspace_toolbar').height() - 40
		});
				
        // Adjust the dimensions of the report inner
        $(this.el).find('.report_inner').css({
            height: $("body").height() - $("#header").height() - $(this.el).find('.workspace-report-toolbar').height() - $(this.el).find('.workspace_toolbar').height() - 80
        });

        // Adjust the dimensions of the error window
        $(this.el).find('.workspace_error').css({
            height: $("body").height() - $("#header").height() - $(this.el).find('.workspace_toolbar').height() - /*$(this.el).find('.workspace_fields').height()*/ - 40
        });

        this._super("clear", arguments);

    },

    adjust: function() {
        $(this.el).find('.workspace_report .report_inner').html('');

        this._super("adjust", arguments);
    },

    remove_dimension: function(event, ui) {
        this.drop_zones.remove_dimension(event, ui);
    }

});

Workspace = reportDesigner.Workspace;
