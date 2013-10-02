
var reportDesigner = reportDesigner || {};

(function() {
	var ConstraintModel;
	(ConstraintModel = function(args) {
		
		_.extend(this, args);
		_.bindAll(this, "getMql", "parseMql","parse", "getConstraints", "save", "setParameter", "getParameter", "deleteParameter");
		this.workspace = args.workspace;
		this.query = args.query;
		
		this.constraints = {};
		this.modelId =  null;
	    this.domainType = null;
	    this.domainId = null;
		this.parameter = {};

		this._frml = {
			condition: "",
			operator: ""
		};

		this.parseMql();		
		
	}).prototype = {

		getMql: function(query) {
			return this.query.metadataQuery.config.mql;
		},

		parseMql: function() {
			var that = this;
			var constraints = {};
			var mql = this.getMql(this.query);
			this.modelId =  mql.model_id;
	    	this.domainType = mql.domain_type;
	    	this.domainId = mql.domain_id;
	    	var order = 0;
			$.each(mql.constraints, function(k,v) {
				var infos = that.parse(v);
				var subConstraint = new Array();
				subConstraint.push(infos.cInfo);
				if(!that.constraints[infos.cName]) {
					that.constraints[infos.cName] = subConstraint;
				} else {
					that.constraints[infos.cName].push(subConstraint)
				}
			});
		},

		parse: function(c) {
			var cInfo = {
				category: null,
				column : null,
				func : null,
				operator : c.operator,
				aggregation : null,
				value : null,
				param : null,

			};
			//c.condition = 'IN([BT_CUSTOMERS.BC_CUSTOMERS_CUSTOMERNAME];"Adam Smith";"Brian Jones")';

			var searchFunction = new RegExp('.*?((?:[a-z][a-z0-9_]*))\\((.*)\\).*',["i"]);
			var result = searchFunction.exec(c.condition);
			if(result) {
				cInfo.func = result[1];
				if(cInfo.func == "IN") {
					var searchIn = new RegExp('\\[(.*?)\\]\\;?(.*|\\d*)',["i"]);
					var subresult = searchIn.exec(result);
					subresult[2] = subresult[2].replace(/"/g,"");
					subresult[2] = subresult[2].replace(/;/g,",");
					cInfo.value = subresult[2];
				}
				else {
					var searchBasic = new RegExp('.*?\\[(.*)\\]',["i"]);
					var searchValues = new RegExp('.*?\\;\\"(.*)\\"',["i"]);
					var subresult = searchBasic.exec(result[2]);
					var subresult2 = searchValues.exec(result[2]);
					cInfo.value = subresult2[1];
				}
				var columnInfos = subresult[1].split(".");
				cInfo.category = columnInfos[0];
				cInfo.column = columnInfos[1];
				if(columnInfos.length == 3) {
					cInfo.aggregation = columnInfos[2];
				}
			}
			else {
				var searchSubOperator = new RegExp('\\[(.*?)\\]([\\&gt;\\&lt;\\=]*)(.*|\\d*)',["i"]);
				result = searchSubOperator.exec(c.condition);
				var columnInfos = result[1].split(".");
				cInfo.category = columnInfos[0];
				cInfo.column = columnInfos[1];
				if(columnInfos.length == 3) {
						cInfo.aggregation = columnInfos[2];
				}
				cInfo.func = result[2];
				cInfo.value = result[3];
			}
			
			var collectedInfo = {
				cInfo : cInfo,
				cName : columnInfos[1]					
			}
			return collectedInfo;
		},

		getConstraints: function(column) {	
			return this.constraints[column];
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
				p2 = '"'+constraint.value+'"';
				}
				f.condition = p0 +"("+ p1 +";"+ p2 +")";
			}
			else {
				p2 = ConditionType[constraint.func]+constraint.value;
				f.condition = p1 + p2;
			}
			//Check for param [param:PARAM_NAME] in value
			var searchParam = new RegExp('\\[param:(.*?)\\]',["i"]);
			var result = searchParam.exec(p2);
			if(result) {
				usedParams.push(result[1]);
			}
		return f;
		},

		setParameter: function(paramName,paramLabel,defaultVal,column) {
			var parameter = {
				name : paramName,
				label : paramLabel,
				values : defaultVal,
				column : column
			};
			this.parameter[paramName] = parameter;
			return true;
		},

		getParameter: function(paramName) {
			return this.parameter[paramName];
		},

		deleteParameter: function(paramName) {
			delete this.parameter[paramName];	
			return true;
		},

		save: function() {
			var self = this;
			var usedParams = new Array();
			var constrainCollector = new Array();
			$.each(this.constraints, function() {
				$.each(this,function(){
					var formula = self.generateMqlFormula(this,usedParams)
					constrainCollector.push(formula);
				}); 
				
			});
			this.query.metadataQuery.config.mql.constraints = constrainCollector;
			//Clean Params
			$.each(this.parameter, function(k,v) {
				if(_.indexOf(usedParams,v.name) < 0) delete this;
			});
			//write Params to mql

		}

	};
	reportDesigner.ConstraintModel = ConstraintModel;
})();
