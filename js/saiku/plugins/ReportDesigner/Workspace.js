var reportDesigner = reportDesigner || {};

reportDesigner.Workspace = Workspace.extend({

    initialize: function(args, options) {

        //this.mode = "crosstab";

        this.mode = this.options.mode;

        this._super("initialize", args);

        this.report = new ReportDesigner({
            workspace: this
        });

        if(typeof args !== 'undefined' && args.query) {
            this.query = this.options.query;
            this.init_query();          
        } 
    },

    render: function(){

        this._super("render", arguments);
        // Add results report
        //$(this.el).find('.workspace-report-toolbar').append(_.template($("#report-toolbar").html())());
        
        $(this.el).find('.workspace_report_canvas').append($(this.report.el));

        //TODO: add report editpanel here
        this.edit_panel = new ElementFormatPanel({
            workspace: this,
            el: $(this.el).find('.workspace-report-toolbar')
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

        this.init_query();
    },

    init_query: function() {

/*
        if(this.query.get('json')) {
            var json = JSON.parse(this.query.get('json'));
            this.selected_model = json.clientModelSelection;
        }
*/

        // Find the selected cube
        if(this.selected_model === undefined) {
            var smodel = this.query.attributes.domainId.replace("/","%2F") + "/" + this.query.attributes.modelId;
            this.selected_model = Saiku.session.sessionworkspace.mdModels[smodel].attributes.path;
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
            //$(this.el).find('.dimension_tree').html('').append($(this.mdmodel_list.el));
            var tHtml = $(this.el).find('.dimension_tree');
            tHtml.html('').append($(this.mdmodel_list.el));

        } else {
            // Someone literally selected "Select a model"
            $(this.el).find('.dimension_tree').html('');
            return;
        }
        //this.populate_selections();

    },
    populate_selections: function(args) {

        //I only get past here once
        //i have to check wether the query has some loaded json model from the server
        /*if(this.query.metadataQuery.get('json')) {
            var model = JSON.parse(this.query.get('json'));
        }*/
       
        // switch active cube option to 'selected' 
        $(".cubes option[value='"+this.selected_model+"']").attr('selected',true);
        
        this.init_query();
        this.query.attributes.domainId = this.query.attributes.domainId.replace("/","%2F");
        var model = this.query.reportSpec;
        this.query.selectedModel = Saiku.session.sessionworkspace.mdModels[this.query.attributes.domainId.replace("/","%2F") + "/" + this.query.attributes.modelId]; 

        if(model) {
            
            var fields = model.fieldDefinitions ? model.fieldDefinitions : false;
            var groups = model.groupDefinitions ? model.groupDefinitions : false;
            //var parameters = model.parameters ? model.parameters : false;
            
            
            if(fields) {
                var $target = $(this.el).find('.fields_list_body.measures ul')
                for(var fields_iter = 0; fields_iter < fields.length; fields_iter++) {
                    var field = fields[fields_iter];
                    var name = field.fieldName;
                    var $icon = $("<span />").addClass('sprite sort none');
                    var $source = $(this.el).find('a[title="' + name + '"]').parent();
                    var $clone = $source.clone().addClass('d_dimension').appendTo($target).prepend($icon);
                    //$(this.el).find("a[title='"+name+"']").trigger('click'); 
                    $source
                        .css({fontWeight: "bold"})
                        .draggable('disable');
                    $source.parents('.parent_dimension')
                        .find('span.root.collapsed')
                        .removeClass('collapsed')
                        .addClass('expand');
                    $source.parents('.parent_dimension')
                        .find('.folder_collapsed')
                        .css({fontWeight: "bold"});
                    $source.parent().children()
                        .css({display: "list-item"}); 

                                              
                    
                }    
            }

            if(groups) {
                var $target = $(this.el).find('.fields_list_body.relgroups ul');
                for(var groups_iter = 0; groups_iter < groups.length; groups_iter++) {
                    var group = groups[groups_iter];
                    var name = group.displayName;
                    var $icon = $("<span />").addClass('sprite sort none');
                    var $source = $(this.el).find('a[title="' + name + '"]').parent();
                    var $clone = $source.clone().addClass('d_dimension').appendTo($target).prepend($icon); 
                    //$("<span />").addClass('sort').addClass(group.sort.toLowerCase()).prependTo($clone);
                    $source
                        .css({fontWeight: "bold"})
                        .draggable('disable');
                    $source.parents('.parent_dimension')
                        .find('span.root.collapsed')
                        .removeClass('collapsed')
                        .addClass('expand');
                    $source.parents('.parent_dimension')
                        .find('.folder_collapsed')
                        .css({fontWeight: "bold"});
                    $source.parent().children()
                        .css({display: "list-item"}); 
                } 
            }

            /*
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
            */
           this.query.workspace = this;
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
		
        $(this.el).find('.workspace_results').css({
            height: $("body").height() - $("#header").height() - $(this.el).find('.workspace_toolbar').height() - $(this.el).find('.workspace_editor').height()-30
        });

        // Adjust the dimensions of the report workspace 
		$(this.el).find('.workspace_report').css({
			height: $(this.el).find('.workspace_results') - 5
		});

        // Adjust the dimensions of the report inner
        $(this.el).find('.report_inner').css({
            height: $(this.el).find('.workspace_report')
        });

        // Adjust the dimensions of the error window
        $(this.el).find('.workspace_error').css({height: $("body").height() - $("#header").height() - $(this.el).find('.workspace_toolbar').height() - 40 
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
