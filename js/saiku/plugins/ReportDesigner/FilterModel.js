/**
 * Created by mg on 14.10.13.
 */
var reportDesigner = reportDesigner || {};

(function () {
    var FilterModel;

    (FilterModel = function (args) {

        _.extend(this, args);
         _.bindAll(this,"_initFilters","_parseMql","save","addFilter","setFilter");

        this.workspace = args.workspace;
        this.query = args.query;
        this.report = this.query.reportSpec;
        this.mql = this.query.metadataQuery.getMql();
        this.modelId = this.query.metadataQuery.config.mql.model_id;
        this.domainType = this.query.metadataQuery.config.domain_type;
        this.domainId = this.query.metadataQuery.config.domain_id;

        //all filters in the current workspace, index corresponds to dropzone
        this.filters = [];

        this._initFilters();

    }).prototype = {

        addFilter: function(columnMeta, index){
            console.log("adding filter to model");

            das hier wird ein backbone model

            columnName

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

            if (index === undefined) {
                this.filters.push(filter);
            } else {
                this.filters.splice(index, 0, filter);
            }

        },


        setFilter: function(index, filter){
            this.filters[index] = filter;
        },

        /*
         * This can either be called from the dropzone or from the filter-dialog when
         * removing a row
         */
        removeFilter: function(index){
            var removedFilter = this.filters.splice(index, 1);
            return removedFilter[0];
        },

      /*
       *  Parse filtermodel from the mql and the reportmodel
       */
        _initFilters: function(){

            var that = this;

            $.each(this.mql.constraints, function(k,v) {
                //for each constraint we add a filter
                this.filters.push(that.parse(v));

            });
        },

        /*
         * Internal parser rules for open-forumla expressions in an MQL-Query.
         * This one is more specialized and simple than PHOMP
         * TODO: Review the MqlParser from WAQR
         */
        _parseMql: function(c) {
            var filter = {
                category: null,
                column : null,
                func : null,
                operator : c.operator,
                aggregation : null,
                value : null,
                defaultValue: null,
                parameter : null //this is the object from the reportSpec
                //TODO:
            };
            //c.condition = 'IN([BT_CUSTOMERS.BC_CUSTOMERS_CUSTOMERNAME];"Adam Smith";"Brian Jones")';

            var searchFunction = new RegExp('.*?((?:[a-z][a-z0-9_]*))\\((.*)\\).*',["i"]);
            var result = searchFunction.exec(c.condition);
            if(result) {
                filter.func = result[1];
                if(cInfo.func == "IN") {
                    var searchIn = new RegExp('\\[(.*?)\\]\\;?(.*|\\d*)',["i"]);
                    var subresult = searchIn.exec(result);
                    subresult[2] = subresult[2].replace(/"/g,"");
                    subresult[2] = subresult[2].replace(/;/g,",");
                    filter.value = subresult[2];
                }
                else {
                    var searchBasic = new RegExp('.*?\\[(.*)\\]',["i"]);
                    var searchValues = new RegExp('.*?\\;\\"(.*)\\"',["i"]);
                    var subresult = searchBasic.exec(result[2]);
                    var subresult2 = searchValues.exec(result[2]);
                    filter.value = subresult2[1];
                }
                var columnInfos = subresult[1].split(".");
                filter.category = columnInfos[0];
                filter.column = columnInfos[1];
                if(columnInfos.length == 3) {
                    filter.aggregation = columnInfos[2];
                }
            }
            else {
                var searchSubOperator = new RegExp('\\[(.*?)\\]([\\&gt;\\&lt;\\=]*)(.*|\\d*)',["i"]);
                result = searchSubOperator.exec(c.condition);
                var columnInfos = result[1].split(".");
                filter.category = columnInfos[0];
                filter.column = columnInfos[1];
                if(columnInfos.length == 3) {
                    filter.aggregation = columnInfos[2];
                }
                filter.func = result[2];
                filter.value = result[3];
            }

            //Check for param [param:PARAM_NAME] in value
            var searchParam = new RegExp('\\[param:(.*?)\\]',["i"]);
            var result = searchParam.exec(filter.value);
            if(result) {
                //Find the corresponding parameter definition
                for (var i = mql.parameters.length - 1; i >= 0; i--) {
                    if(mql.parameters[i].name==result[1]){
                        filter.value = parameter.defaultValue;
                        //we assume that a prpt parameter has to exist
                        filter.parameter = this.report.getParameterByName(mql.parameters[i].name);
                    }
                };

            }

            return filter;
        },

        generateMqlFormula: function(constraint,usedParams) {
            var f = {};
            _.extend(f,this._frml);
            var funcs = new Array("LIKE","BEGINSWITH","ENDSWITH","CONTAINS","EQUALS","IS_NULL","NOT_NULL","IN");
            f.operator = constraint.operator;
            var p0, p1, p2;
            p1 = "["+constraint.category+"."+constraint.column;
            if(constraint.aggregation) { p1 +="."+constraint.aggregation; }
            p1 += "]";

            if($.inArray(constraint.func,funcs) >= 0) {
                p0 = ConditionType[constraint.func];
                if(constraint.func == "IN") {
                    var transValues = constraint.value.split(",");
                    $.each(transValues, function(k,v) {
                        transValues[k] = '"'+v+'"';
                    });
                    var combined = transValues.join(";");
                    p2  = combined;
                }
                else {
                    if(typeof constraint.param !== "undefined"){
                        p2 = constraint.value;	//Parameters do not need ""
                    }else{
                        p2 = '"'+constraint.value+'"';
                    }
                }
                f.condition = p0 +"("+ p1 +";"+ p2 +")";
            }
            else {
                p2 = ConditionType[constraint.func]+constraint.value;
                f.condition = p1 + p2;
            }
            //Check for param [param:PARAM_NAME] in value
//            var searchParam = new RegExp('\\[param:(.*?)\\]',["i"]);
//            var result = searchParam.exec(p2);
//            if(result) {
//                usedParams.push(result[1]);
//            }
            return f;
        },

        /*
         * This renders the view-model into the reportmodel and the querymodel
         */
        //TODO: Rewrite this
        save: function() {
            var self = this;
            var constraints = [];

            for (var i = 0; i < this.filters.length; i++) {
                var filter = this.filters[i];
                var formula = self.generateMqlFormula(filter);
                constraints.push(formula);
                //If filter has promt, also add param to query and report
            }

            this.query.metadataQuery.config.mql.constraints = constraints;

            //Clean Params
//            $.each(this.parameters, function(k,v) {
//                if(_.indexOf(usedParams,v.name) < 0){
//                    delete this;
//                }else{
//                    var param = {
//                        name: v.name,
//                        type: v.type,
//                        defaultValue: v.defaultValue
//                    }
//                    self.query.metadataQuery.addParameter(param, _.indexOf(usedParams,v.name));
//                    self.query.reportSpec.addParameter(v);
//                }
//            });
        }


    };
    reportDesigner.FilterModel = FilterModel;
})();
