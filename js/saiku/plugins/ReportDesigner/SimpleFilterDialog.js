/*
 * SelectionsModal.js
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
 * Dialog for member selections
 */
var SimpleFilterDialog = Modal.extend({
    type: "simpleFilterDialog",

    buttons: [{
        text: "Save",
        method: "save"
    }, {
        text: "Cancel",
        method: "close"
    }],

    events: {
        'click a': 'call',
        'dblclick select option': 'click_move_selection',
        'click div.selection_buttons a.form_button': 'move_selection',
        'click div.updown_buttons a.form_button': 'updown_selection',
        'click input#prompt_parameter': 'promt_select'
    },

    initialize: function(args) {
        // Initialize properties
        _.extend(this, args);

        this.workspace = args.workspace;
        this.filterModel = args.filterModel;
        this.query = args.workspace.query;
        this.action = args.action || "change";

        this.options.title = "Filter on " + this.filterModel.columnMeta.name;
        this.message = "Fetching values...";
        this.show_unique = false;

        _.bindAll(this, "populate", "finished", "build_filterquery", "populate_multiselect","close");

        // Resize when rendered
        this.bind('open', this.post_render);
        this.render();

        var template = _.template($("#template-filter-dialog").html())(this);

        $(this.el).find('.dialog_body').html(template);
                
        var filterRow = new FilterRow({
            el: $(this.el).find('.simple_filter_row'),
            workspace: this.workspace,
            filterModel: this.filterModel
        });

        if(this.filterModel.columnMeta.type == "STRING") {

            this.switch_multiselect();

            this.build_filterquery();

            var mqlQueryString = this.metadataQuery.toXml();

            this.filterResult = new FilterResult();

            var self = this;

            this.filterResult.save({}, {
                error: function(model, response) {},
                success: function(model, response) {
                    self.populate(model, response);
                    return false;
                },
                data: {
                    mql: mqlQueryString
                }
            });


        } else {
            this.switch_expression();
        }

        // Show dialog
        Saiku.ui.unblock();
        $(this.el).parent().find('.ui-dialog-titlebar-close').bind('click',this.close);


    },

    build_filterquery: function() {
        this.metadataQuery = new reportDesigner.mql.Query({
            mql: {
                domain_id: this.query.metadataQuery.config.mql.domain_id, //.replace("/","%2F"),
                model_id: this.query.metadataQuery.config.mql.model_id
            }
        });

        var mc = this.filterModel.columnMeta;

        var selection = {
            table: mc.category,
            column: mc.id,
            aggregation: AggregationFunction.NONE
        };

        this.metadataQuery.addSelection(selection);

    },

    populate: function(model, response) {

        this.populate_multiselect(model, response);

        var self = this;
        $(this.el).find('.filterbox').autocomplete({
            minLength: 1,
            source: function(request, response) {
                response($.map(self.available_values, function(item) {
                    if(item[0] != null) {
                        var item_str = item[0] + "";
                        if(item_str.toLowerCase().indexOf(request.term.toLowerCase()) > -1) {
                            var aa = item[0];
                            return {
                                label: item[0],
                                value: item[0]
                                //label: item_str ,
                                //value: item_str                                       
                            };
                        }
                    }
                }));
            },
            select: function(event, ui) {
                var value = self.show_unique_option == false ? escape(ui.item.value) : ui.item.label;
                $(self.el).find('.available_selections select option[value="' + value + '"]').appendTo($(self.el).find('.used_selections select'));
                $('#filter_selections').val('');
            },
            close: function(event, ui) {
                $('#filter_selections').val('');
            }
        }).data("autocomplete")._renderItem = function(ul, item) {
            return $("<li></li>").data("item.autocomplete", item)
            //.append( "<a class='label'>" + item.label + "</a><br><a class='description'>" + item.value + "</a>" )
            .append("<a class='label'>" + item.label + "</a>").appendTo(ul);
        };

    },

    populate_multiselect: function(model, response) {

        try {

            //var template = _.template($("#template-selections").html())(this);
            //$(this.el).find('.dialog_body').html(template);
            this.available_values = response.resultset;
            this.selected_values = null; 
            
            var getConstraintFromMql = this.workspace.query.metadataQuery.getConstraint(this.filterModel.index);
            var availableConstraints = new Array();
            if(!_.isEmpty(getConstraintFromMql)) {
                var constraint = reportDesigner.mql.Phomp.formulaToJs(getConstraintFromMql.condition);
                    if(constraint.args) {
                    $.each(constraint.args,function(j,k) {
                        if(k.type == "string") {
                            availableConstraints.push(k.text.replace(/"/g,""));
                        }
                    });
                }
            }
            if(!_.isEmpty(availableConstraints)) {
                this.selected_values = availableConstraints;
            }
            
            var used_values = [];
            // Populate both boxes
            if(this.selected_values != null) {
                $(this.el).find('.used_selections select').removeAttr('disabled');
                for(var j = 0; j < this.selected_values.length; j++) {
                    var value = this.selected_values[j];
                    //if (value.levelUniqueName == this.value.level &&
                    //    member.type == "MEMBER") {
                    $("<option />").text(value).val(value).appendTo($(this.el).find('.used_selections select'));
                    used_values.push(value);
                    //}
                }
            }

            // Filter out used values
            this.available_values = _.select(this.available_values, function(obj) {
                return used_values.indexOf(obj[0]) === -1;
            });

            $(this.el).find('.available_selections select').removeAttr('disabled');
            for(var i = 0; i < this.available_values.length; i++) {

                var value = this.available_values[i];

                //More elegant to remove null with _underscore?
                if( !_.isNull(value[0]) && !_.isEmpty(value[0]) ) {

                    $("<option />").text(value[0]).val(value[0]).appendTo($(this.el).find('.available_selections select'));
                }

            }
        } catch(e) {
            $(this.el).html("Could not load selections");
        }

    },

    post_render: function(args) {
        $(args.modal.el).parents('.ui-dialog').css({
            width: "800px"
        });
        //this.center();
    },

    switch_multiselect: function() {
        this.multiselect = true;
        $(this.el).find('.filter_selection').addClass('selected');
        $(this.el).find('.filter_expression').removeClass('selected');
        $(this.el).find('.select_from_list').show();
        $(this.el).find('.simple_filter_row').hide();
    },

    switch_expression: function() {
        this.multiselect = false;
        $(this.el).find('.filter_selection').removeClass('selected');
        $(this.el).find('.filter_expression').addClass('selected');
        $(this.el).find('.select_from_list').hide();
        $(this.el).find('.simple_filter_row').show();
    },

    save: function() {
        //prevent User from saving Filter without values
        if($(this.el).find('div.simple_filter_row').css('display') == 'none') {
            var sel = $(this.el).find('.used_selections').find('select');
            if(sel[0].childElementCount == 0) {
                sel.parent().children('span:first-child').css('color','red');
                return;
            }
        }
        
        // Notify user that updates are in progress
        var $loading = $("<div>Saving...</div>");
        $(this.el).find('.dialog_body').children().hide();
        $(this.el).find('.dialog_body').prepend($loading);

        if(this.multiselect == false) {
            this.filterModel.conditionType = $(this.el).find('.op option:selected').val();
            this.filterModel.value = $(this.el).find("input[name=value]").val();
        } else {
            var multiSelection = [];
            // Loop through selections
            $(this.el).find('.used_selections option').each(function(i, selection) {
                multiSelection.push($(selection).val());
            });
            this.filterModel.value = multiSelection;
        }

        var constraint = {
            operator: OperatorType.AND,
            condition: reportDesigner.mql.FilterController.filterRowToFormula(this.filterModel)
        }

        this.query.metadataQuery.setConstraint(constraint, this.filterModel.index);
        
        this.finished();
    },

    close: function() {
        //remove from Filter_row
        if(this.action == "new"){
            var $targetFilter = $(this.workspace.el).find('.fields_list_body.filters').find('a[title="' + this.filterModel.columnMeta.name + '"]').parent('li').remove();
            this.query.metadataQuery.removeConstraint(this.filterModel.index); 
        }
        
        //cz alles Dragable
        //enable dimension in  sidebar
/*        var $original = $(this.workspace.el).find('.sidebar')
            .find('a[title="' + this.filterModel.columnMeta.name + '"]').parent('li');
        $original
            .draggable('enable')
            .css({ fontWeight: 'normal' });
        
        // Unhighlight the parent if applicable
        if ($original.parents('.parent_dimension')
                .children().children('.ui-state-disabled').length === 0) {
            $original.parents('.parent_dimension')
                .find('.folder_collapsed')
                .css({fontWeight: "normal"});
        }
*/ 
        $(this.el).dialog('destroy').remove();
   },

    move_selection: function(event) {
        event.preventDefault();
        var action = $(event.target).attr('id');
        var $to = action.indexOf('add') !== -1 ? $(this.el).find('.used_selections select') : $(this.el).find('.available_selections select');
        var $from = action.indexOf('add') !== -1 ? $(this.el).find('.available_selections select') : $(this.el).find('.used_selections select');
        var $els = action.indexOf('all') !== -1 ? $from.find('option') : $from.find('option:selected');
        $els.detach().appendTo($to);
    },

    updown_selection: function(event) {
        event.preventDefault();
        var action = $(event.target).attr('href').replace('#', '');
        if(typeof action != "undefined") {
            if("up" == action) {
                $(this.el).find('.used_selections option:selected').insertBefore($('.used_selections option:selected:first').prev());
            } else if("down" == action) {
                $(this.el).find('.used_selections option:selected').insertAfter($('.used_selections option:selected:last').next());
            }

        }
    },

    click_move_selection: function(event, ui) {
        var to = ($(event.target).parent().parent().hasClass('used_selections')) ? '.available_selections' : '.used_selections';
        $(event.target).appendTo($(this.el).find(to + ' select'));
        if(to == ".used_selections") {
            $(this.el).find(to + ' select').prop('disabled', false);
        }
        else if(to == ".available_selections") {
            if($(this.el).find('.used_selections select').children().length <= 0) {
                $(this.el).find('.used_selections select').prop('disabled', true);
            }
        }
    },

    promt_select: function(event){
        if($(event.target).prop('checked')) {
            $(this.el).find('input.parameter_name').prop('disabled', false);
            $(this.el).find('input.parameter_label').prop('disabled', false);
            $(this.el).find('.param_lab').css("color","black");
        } else {
            $(this.el).find('input.parameter_name').prop('disabled', true);
            $(this.el).find('input.parameter_label').prop('disabled', true);
            $(this.el).find('.param_lab').css("color","#cccccc");
		}
    
	},
    
    finished: function() {
        $(this.el).dialog('destroy').remove();
        this.query.run();
    }
});