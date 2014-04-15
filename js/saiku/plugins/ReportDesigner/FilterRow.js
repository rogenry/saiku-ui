/*
 * Copyright (c) 2012, Marius Giepz. All rights reserved.
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
 * A filter row represents aggregation/column/operator/value(s)
 */
var FilterRow = Backbone.Epoxy.View.extend({
    
    className: "filter_row",

    bindings: "data-bind"

    initialize: function(args) {
        this.el = args.el;
        this.workspace = args.workspace;
        this.model = args.model;
        this.columnMeta = args.filter.columnMeta;
        this.operatorType = args.operatorType;
        this.index = args.index;

        _.bindAll(this, "render", "storeFilterValues");
        this.render();
    },

    render: function() {

            var variables = {
                filterIndex: this.index,
                availableComparators: AvailableComparators[this.columnMeta.type],
                availableAggTypes: this.columnMeta.aggTypes,
                availableOpr: AvailableOperators[this.operatorType],
                //column:  this.columnMeta.name,
                availableWidgets: ['textbox','datepicker','single-select','multiselect']
            };

            //hier müssen noch available comparators rein, entsprechend columnMeta.type

            var template = _.template( $("#template-filter-row").html(), variables );
           
            this.el.append(template);

            if(this.columnMeta.type == DataType.DATE){
                $(this.el).find(".value").datepicker({
                showOn: "button",
                dateFormat: "yy-mm-dd",
                changeMonth: true,
                changeYear: true,
                buttonImage: "../../ReportDesigner/images/calendar.png",
                buttonImageOnly: true,
                //defaultDate: selectedDateFrom,
                //minDate: startDate,
                //maxDate: endDate,
                onSelect: function(date, input){}
               });
            }

            var $itsRow = $(this.el).find('.filterrow[filterIndex = '+this.index+']');

            $itsRow.find('.op option[value='+this.filter.func+']').attr('selected',true);
            $itsRow.find("input[name=value]").val(this.filter.value); //value or default value
            $itsRow.find('.func option[value="'+this.filter.operator+'"]').attr('selected',true);

            if(this.filter.parameter!=null){
                $itsRow.find("input[name=prompt]").attr('checked','checked');
                $itsRow.find("input[name=name]").val(this.filter.parameter.name);
                $itsRow.find("input[name=label]").val(this.filter.parameter.label);
            }

    },

    storeFilterValues: function(filter){

        var $itsRow = $(this.el).find('.filterrow[filterIndex = '+this.index+']');

        //was wenn der filter neu ist? wo kommt die parameerquery her?

        filter.operator = $itsRow.find('.op option:selected').val();
        filter.value= $itsRow.find("input[name=value]").val();
        filter.func = $itsRow.find('.func option:selected').val();

/*
        var filter = {
            columnMeta: columnMeta,
            category: columnMeta.category,
            column : columnMeta.id,
            func : "EQUALS",
            operator : "",
            aggregation : columnMeta.aggTypes[0],
            value : null,
            defaultValue: null,
            parameter : null
        };
*/

        //read from ui and store to filterobject. this is called from FilterDialog?
    }

});