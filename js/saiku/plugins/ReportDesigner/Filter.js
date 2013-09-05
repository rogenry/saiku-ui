/*
 * Report.js
 * 
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
var FilterRow = Backbone.View.extend({
    className: "filter_row",

    events: {
        "change input[type=select] .col": "onColumnSelect"
    },
    
    initialize: function(args) {
        this.workspace = args.workspace;
        this.filterSource = args.filter;
        this.filterRowCount =  args.filterRowCount;
        this.columnMeta = args.columnMeta;
        this.filter = this.filterSource[this.filterRowCount];
        
        _.bindAll(this, "render", "onColumnSelect");
        this.render();
    },

    render: function() {
            
            //wenn es sich um einen simplen filter handelt, dann wird die column festgesetzt
            
            this.filterId = this.filterRowCount    
            
            var operatorType = this.filterId == 0 ? "HEAD" : "FOLLOW";

            var variables = { 
                availableComparators: AvailableComparators[this.columnMeta.type],
                availableAggTypes: this.columnMeta.aggTypes,
                availableOpr: AvailableOperators[operatorType],
                availableFilterId: this.filterId,
            }; //entweder alle oder nur eine

            //hier müssen noch available comparators rein, entsprechend columnMeta.type

            var template = _.template( $("#template-filter-row").html(), variables );
           
            this.el.append(template);

            $(this.el).find(".col").html(this.columnMeta.name);            

            if(this.columnMeta.type == DataType.DATE){
                $(this.el).find(".value").datepicker({
                dateFormat: "yy-mm-dd",
                changeMonth: true,
                changeYear: true,
                //defaultDate: selectedDateFrom,
                //minDate: startDate,
                //maxDate: endDate,
                onSelect: function(date, input){
                }});
            }

            

            $(this.el).find('.filterrow[filterId = '+this.filterRowCount+']').find('.op option[value='+this.filter.func+']').attr('selected',true);
            $(this.el).find('.filterrow[filterId = '+this.filterRowCount+']').find("input[name=value]").val(this.filter.value);
            $(this.el).find('.filterrow[filterId = '+this.filterRowCount+']').find('.opr option[value="'+this.filter.operator+'"]').attr('selected',true);
        
            //disables

    },

    onColumnSelect: function(){
        alert("column changed");
        //wenn keine column selektiert, dann werden die drei anderen boxen ausgegraut
        //Ansonsten wird nachgeschaut, was für einen typ die column hat, dementsprechend wird
        //die operator-liste reduziert/neu aufgebaut und entschieden ob eine Textbox oder ein
        //kalender zum einsatz kommt
        this.$el.find("agg");
        this.$el.find("op");

    }
});