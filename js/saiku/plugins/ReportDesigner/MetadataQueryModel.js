/**
 * @author mgiepz
 */

/*
 * saiku namespace
 */

var reportDesigner = reportDesigner || {};
reportDesigner.mql = reportDesigner.mql || {};

/*
 * Enums
 */

var AggregationFunction = {
	NONE: "NONE",
	SUM: "SUM",
	AVERAGE: "AVERAGE",
	COUNT: "COUNT",
	COUNT_DISTINCT: "COUNT_DISTINCT",
	MINIMUM: "MINIMUM",
	MAXIMUM: "MAXIMUM"
};

var OperatorType = {
	OR: 'OR',
	OR_NOT: 'OR NOT',
	AND: 'AND',
	AND_NOT: 'AND NOT'
};

var ConditionType = {
	LIKE: 'LIKE',
	BEGINSWITH: 'BEGINS WITH',
	ENDSWITH: 'ENDS WITH',
	CONTAINS: 'CONTAINS',
	EQUALS: 'EQUALS',
	LESS_THAN: '&lt;',
	LESS_THAN_OR_EQUAL: '&lt;=',
	MORE_THAN: '&gt;',
	MORE_THAN_OR_EQUAL: '&gt;=',
	IS_NULL: 'ISNA',
	NOT_NULL: 'ISNA',
	IN: 'IN'
};

var SortType = {
	ASC: "ASC",
	DESC: "DESC",
	NONE: "NONE"
};

var DataType = {
	NUMERIC: "NUMERIC",
	STRING: "STRING",
	DATE: "DATE",
	BOOLEAN: "BOOLEAN",
	UNKNOWN: "UNKNOWN",
	NONE: "NONE"
};

//Define the comparators that are allowed for a certain datatype
//TODO: Map them to meaningfull strings for the type (i.e. after instead of more_than on dates)
var AvailableOperators = {
HEAD : [
	"",	
	"AND",
	"AND NOT"
],
FOLLOW : [
	"AND",
	"AND NOT",
	"OR",
	"OR NOT",
]
};

var AvailableComparators = {
STRING : [
	"LIKE",
	"BEGINSWITH",
	"ENDSWITH",
	"CONTAINS",
	"EQUALS",
	"LESS_THAN",
	"LESS_THAN_OR_EQUAL",
	"MORE_THAN",
	"MORE_THAN_OR_EQUAL",
	"IS_NULL",
	"NOT_NULL",
	"IN"
],
NUMERIC : [
	"EQUALS",
	"LESS_THAN",
	"LESS_THAN_OR_EQUAL",
	"MORE_THAN",
	"MORE_THAN_OR_EQUAL",
	"IS_NULL",
	"NOT_NULL",
	"IN"
],
DATE : [
	"EQUALS",
	"LESS_THAN",
	"LESS_THAN_OR_EQUAL",
	"MORE_THAN",
	"MORE_THAN_OR_EQUAL",
	"IS_NULL",
	"NOT_NULL"
]
};

/*
 * Metadata Query Domain Model
 *
 */

(function() {
	// new Query (Phomp.mqlToJs(xmlString));
	var Query;
	(Query = function(config) {

		var defaultConfig = {
			mql: {
				domain_type: "relational",
				domain_id: null,
				model_id: null,
				selections: [],
				constraints: [],
				parameters:[],
				orders: [],
				options: {
					disable_distinct: "false"
				}
			}
		};

		var p;
		for(p in defaultConfig.mql) {
			if(typeof(config.mql[p]) === "undefined") {
				config.mql[p] = defaultConfig.mql[p];
			}
		}

		this.config = config;

		console.log(defaultConfig.mql.domain_type);

	}).prototype = {

		getMql: function(){
			return this.config.mql;
		},

		addSelection: function(selection) {

			/*
    	table: null,
   		column: null,
   		aggregation: AggregationFunction.NONE
		*/

			var defaultSelection = {
				aggregation: AggregationFunction.NONE
			};
			var p;
			for(p in defaultSelection) {
				if(typeof(selection[p]) === "undefined") {
					selection[p] = defaultSelection[p];
				}
			}

			this.config.mql.selections.push(selection);
		},

		getSelection: function(index) {
			return this.config.mql.selections[index];
		},


		removeSelection: function(index) {
			var removedSelection = this.config.mql.selections.splice(index, 1);
			return removedSelection[0];
		},

		addConstraint: function(constraint, index) {

			var defaultConstraint = {
				operator: OperatorType.AND
			};
			var p;
			for(p in defaultConstraint) {
				if(typeof(constraint[p]) === "undefined") {
					constraint[p] = defaultConstraint[p];
				}
			}

			this.config.mql.constraints.splice(index, 0, constraint);
		},

		addParameter: function(parameter, index){
			var defaultParameter = {
			};
			var p;
			for(p in defaultParameter) {
				if(typeof(parameter[p]) === "undefined") {
					parameter[p] = defaultConstraint[p];
				}
			}
			this.config.mql.parameters.splice(index, 0, parameter);
		},

		removeParameter: function(index){
			var removedParamter = this.config.mql.parameters.splice(index, 1);
			return removedParamter[0];
		},

		setConstraint: function(constraint, index){
			this.config.mql.constraints[index] = constraint;
		},

		getConstraint: function(index) {
			return this.config.mql.constraints[index];
		},

		removeConstraint: function(index) {
			var removedConstraint = this.config.mql.constraints.splice(index, 1);
			return removedConstraint[0];
		},

		addSort: function(order, index) {

			/*
		direction: SortType.ASC,
   		view_id: null,
   		column_id: null
		*/

			var defaultOrder = {
				direction: SortType.ASC
			};
			var p;
			for(p in defaultOrder) {
				if(typeof(order[p]) === "undefined") {
					order[p] = defaultOrder[p];
				}
			}

			//if (typeof (index) ==="undefined") {
			this.config.mql.orders.push(order);
			//}else{
			//}
		},

		getSort: function(index) {
			return this.config.mql.orders[index];
		},

		removeSort: function(index) {
			var removedSort = this.config.mql.orders.splice(index, 1);
			return removedSort[0];
		},

		getOption: function(option) {

			return this.config.mql.options[option];

		},

		setOption: function(option, value) {

			this.config.mql.options[option] = value;

		},

		toXml: function() {
			return reportDesigner.mql.Phomp.jsToMql(this.config);
		}

	};
	reportDesigner.mql.Query = Query;

}());