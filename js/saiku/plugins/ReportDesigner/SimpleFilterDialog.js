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
    filterId: 1,

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
        'click input.prompt_parameter': 'prompt_select',
        'click a.addRow': 'addRow'
    },

    initialize: function(args) {
        // Initialize properties
        _.extend(this, args);

        this.workspace = args.workspace;
        this.query = this.workspace.query;
        this.key = args.key;
        // [F] this.filterModel = args.filterModel;
        this.constraintModel = this.workspace.constraintModel;
        var columnInfo = this.key.split("/");
        this.columnMeta = this.constraintModel.query.selectedModel.getColumnById(columnInfo[1],columnInfo[3]);
        this.filterModel = {
                category: this.columnMeta.category,
                column : this.columnMeta.id,
                func : "EQUALS",
                operator : "",
                aggregation : this.columnMeta.aggTypes[0],
                value : null,
                prompt : 0,
                param : ""
        };
        var blank = new Array;
            blank.push(_.extend(this.filterModel));

        this.action = args.action || "change";
        this.filter = this.constraintModel.getConstraints(columnInfo[3]) || _.extend(blank);
        this.filter['columnMeta'] = this.columnMeta;
        this.filterRowCount = this.filter.length;

        // [F] this.options.title = "Filter on " + this.filterModel.columnMeta.name;
        this.options.title = "Filter on " + this.filter["columnMeta"].name;

        this.message = "Fetching values...";
        this.show_unique = false;

        _.bindAll(this, "populate", "finished", "build_filterquery", "populate_multiselect","close");

        // Resize when rendered
        this.bind('open', this.post_render);
        this.render();

        var template = _.template($("#template-filter-dialog").html())(this);

        $(this.el).find('.dialog_body').html(template);

        if(this.filterRowCount > 0) {
           for(var i = 0; i < this.filterRowCount; i++) {
                var filterRow = new FilterRow({
                el: $(this.el).find('.simple_filter_row'),
                workspace: this.workspace,
                filter: this.filter,
                filterRowCount: i,
                columnMeta : this.filter['columnMeta']
                });
            }
        } else {     
            var filterRow = new FilterRow({
                el: $(this.el).find('.simple_filter_row'),
                workspace: this.workspace,
                filter: this.filter,
                filterRowCount: 0,
                columnMeta : this.filter['columnMeta']
            });
        }
        
        if(this.filter['columnMeta'].type == "STRING" && this.filterRowCount <= 1 && (this.filter[0].func == "EQUALS" || this.filter[0].func == "IN")) {

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

        var mc = this.filter['columnMeta'];

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

            this.available_values = response.resultset;
            this.selected_values = null; 
            
            var selected_values_collected = new Array();
            $.each(this.filter, function(v,k) {
                if(k.value!=null){
                    var values = k.value.split(",");
                    $.each(values, function(w,l) {
                        selected_values_collected.push(l);
                    });
                }
            });
            this.selected_values = selected_values_collected; 

            if(!_.isEmpty(this.selected_values)) {
                var self = this;
                $(this.el).find('.used_selections select').removeAttr('disabled');
                $.each(this.selected_values, function(key,value) {
                    $("<option />").text(value).val(value).appendTo($(self.el).find('.used_selections select'));
                });
                this.available_values = _.select(this.available_values, function(obj) {
                    return self.selected_values.indexOf(obj[0]) === -1;
                });
            }            

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

    call: function(event) {
        // Determine callback
        var callback = event.target.hash.replace('#', '');
        
        // Attempt to call callback
        if (! $(event.target).hasClass('disabled_toolbar') && this[callback]) {
                if(event.target.hash != "#save" && event.target.hash != "#close") {
                    if(this.filterRowCount > 1 && callback == "switch_multiselect") {
                        $(this.el).find('#errorline').html("Filter is too complex and cannot be shown as Multi Select!");
                        return false;        
                    }
                    else if(this.filterRowCount == 1 && this.filter['columnMeta'].type != "STRING") {
                        $(this.el).find('#errorline').html("Filter-Values cannot be shown as Multi Select!");
                        return false;
                    }
                    else if(this.filterRowCount == 1 && (this.filter[0].func != "EQUALS" && this.filter[0].func != "IN")) {
                        $(this.el).find('#errorline').html("Filter is too complex and cannot be shown as Multi Select!");
                        return false;        
                    }   
                }            
                $(this.el).find('#errorline').html("");
                this[callback](event);
            }
       return false;
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
        var formula;
        var that = this;
        if(this.multiselect == false) {
            var filterRowModels = new Array();
            var activeFilters = $(this.el).find('.filterrow');
            $.each(activeFilters,function() {
                var model = {}; 
                _.extend(model,that.filterModel);
                model.func = $(this).find('.op option:selected').val();
                model.aggregation = $(this).find('.agg option:selected').val();
                model.operator = $(this).find('.opr option:selected').val();
                //PARAMETER OR NOT?
                if($(this).find('.prompt_parameter').prop('checked')) {
                    model.prompt = 1;
                    var parameter_name =  $(this).find('.parameter_name').val();
                    var parameter_label =  $(this).find('.parameter_label').val();
                    model.param = parameter_name;
                    model.value = "[param:"+parameter_name+"]";
                    that.constraintModel.setParameter(parameter_name,parameter_label,$(this).find("input[name=value]").val(),that.columnMeta.id);
                } else { 
                    model.value =  $(this).find("input[name=value]").val();
                }
                filterRowModels.push(model);
            });
            
            filterRowModels['columnMeta'] = this.columnMeta;
            this.constraintModel.constraints[this.columnMeta.id] = filterRowModels;
            
        } else {
            var multiSelection = [];
            // Loop through selections
            $(this.el).find('.used_selections option').each(function(i, selection) {
                multiSelection.push($(selection).val());
            });
            var multiSelectionJnd = multiSelection.join(",");
            this.filter[0].value = multiSelectionJnd;
            this.filter[0].func = "IN";
            this.filter[0].operator = "AND";
            
            this.constraintModel.constraints[this.columnMeta.id] = this.filter;
        }

        this.constraintModel.save();
        this.finished();
    },

    close: function() {
        //remove from Filter_row
        if(this.action == "new"){
            var $targetFilter = $(this.workspace.el).find('.fields_list_body.filters').find('a[title="' + this.filter['columnMeta'].name + '"]').parent('li').remove();
        }
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

    prompt_select: function(event){
        var filterId = $(event.target).attr('filterid');
        if($(event.target).prop('checked')) {
            $(this.el).find('input.parameter_name[filterid='+filterId+']').prop('disabled', false).css('background-color','#ffffff');
            $(this.el).find('input.parameter_label[filterid='+filterId+']').prop('disabled', false).css('background-color','#ffffff');
        } else {
            $(this.el).find('input.parameter_name[filterid='+filterId+']').prop('disabled', true).css('background-color','#cccccc');
            $(this.el).find('input.parameter_label[filterid='+filterId+']').prop('disabled', true).css('background-color','#cccccc');
		}
    },

    addRow: function(event) {
        this.filterRowCount++;
        var filterrow = new FilterRow({
            el: $(this.el).find('.simple_filter_row'),
            workspace: this.workspace,
            filter: this.filter,
            filterRowCount: this.filterRowCount-1,
            columnMeta : this.filter['columnMeta']
        });
    },
    
    finished: function() {
        $(this.el).dialog('destroy').remove();
        this.query.run();
    }
});