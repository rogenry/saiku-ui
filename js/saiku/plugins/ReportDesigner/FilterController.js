var reportDesigner = reportDesigner || {};
    reportDesigner.mql = reportDesigner.mql || {};
var exports = reportDesigner.mql;

(function(window) {

    var FilterController = function() {};

    FilterController.filterRowToReportParameter = function(model) {

    };

    FilterController.formulaConstraintToFilterModel = function(constraint, query) {

        var js = reportDesigner.mql.Phomp.formulaToJs(constraint.condition.replace("<![CDATA[", "").replace("]]>", ""));

        var filterModel = {};

        if(js.name != null && js.name != "AND" && js.name != "OR") {
            filterModel.filterType = "MULTI";
            var filterLength = js.args.length;
            var filterValues = new Array();
            var category = js.args[0].arg.left.text;
            var column = js.args[0].arg.right.text;
            filterModel.conditionType = js.name;
            for(var i = 1; i < filterLength; i++) {
                filterValues.push(FilterController.stringToValue(js.args[i].text));
            }
            filterModel.value = filterValues;
            filterModel.columnMeta = query.selectedModel.getColumnById(category,column);
            filterModel.aggType = filterModel.columnMeta.aggTypes[0];
        }
        else {
            filterModel.filterType = "ROW";
            var category = js.args[0].left.arg.left.text;
            var column = js.args[0].left.arg.right.text;
            var filterValues = new Array();
            var filterConditionTypes = new Array();
            var a = 0;
            $.each(js.args, function() {
                var conType = this.text;
                switch(conType) {
                    case("<") : 
                        filterConditionTypes[a] = "LESS_THAN";
                        break;
                    case("<=") : 
                        filterConditionTypes[a] = "LESS_THAN_OR_EQUAL";
                        break;
                    case(">") : 
                        filterConditionTypes[a] = "MORE_THAN";
                        break;
                    case(">=") : 
                        filterConditionTypes[a] = "MORE_THAN_OR_EQUAL";
                        break;
                    default: break;
                }
                filterValues[a] = FilterController.stringToValue(this.right.text);                
                a++;
            },{filterValues:filterValues, a:a, filterConditionTypes:filterConditionTypes});

            filterModel.value = filterValues;
            filterModel.conditionType = filterConditionTypes;
            filterModel.columnMeta = query.selectedModel.getColumnById(category,column);
            filterModel.aggType = filterModel.columnMeta.aggTypes[0];
            filterModel.count = js.args.length; 
        }
        return filterModel;
    };

    FilterController.filterRowToFormula = function(model) {

        var formula;

        var aggExpression = "";

        if(typeof(model.aggType) != "undefined" && model.aggType != AggregationFunction.NONE) {
            aggExpression = "." + model.aggType;
        }

        var column = '[' + model.columnMeta.category + '.' + model.columnMeta.id + aggExpression + ']';

        var value = FilterController.valueToString(model); //auch den model.parameter mit einbauen, wenn er existiert
        //und wenn er existiert, dann auch direkt in den report einbauen?
        if(model.conditionType == "LIKE") {
            var val =  value.replace(/"/g, "") ;
            formula = 'LIKE(' + column + ';"%' + value.replace(/"/g, "") + '%")';
        } else if(model.conditionType == ConditionType.EQUAL || model.conditionType == ConditionType.IN ) {
            if($.isArray(model.value) && ! (model.value.length == 1)) { 
                formula = 'IN(' + column + ';' + value + ')';        
            } else {
                formula = 'EQUALS(' + column + ';' + value + ')';  
            }
        } else if(model.conditionType == "LESS_THAN") {
            formula = column + '<' + value;
        } else if(model.conditionType == "LESS_THAN_OR_EQUAL") {
            formula = column + '<=' + value;
        } else if(model.conditionType == "MORE_THAN") {
            formula = column + '>' + value;
        } else if(model.conditionType == "MORE_THAN_OR_EQUAL") {
            formula = column + '>=' + value;
        }

        //return "<![CDATA[" + formula + "]]>";
        return formula;
    };

    FilterController.stringToValue = function(value){
        return value.replace(/"/g, "").replace(/%/g, "");
    }

    FilterController.valueToString = function(model) {

        if(model.value == null) return "";

        if($.isArray(model.value)) {
            return '"' + model.value.join('";"') + '"';
        } else if(model.columnMeta.type == DataType.DATE) {
            return 'DATEVALUE("' + model.value + '")';
        }

        //the standard string value needs to be in ""
        return '"' + model.value + '"';

        //if the model has a param, we know that it needs to be prompted 
        if(typeof(model.parameter) != "undefined" && model.parameter != null) {
            if(model.columnMeta.typeof == DataType.DATE) {
                return "DATEVALUE([param:" + model.parameter + "])";
            } else {
                return "[param:" + model.parameter + "]";
            }
        }
    };

    if(typeof(define) === "function" && define.amd) {
        define(function() {
            return PentahoMqlUtils;
        });
    } else window.FilterController = FilterController;

    return FilterController;

})(typeof exports === "undefined" ? window : exports);