
var reportDesigner = reportDesigner || {};

(function() {
	var ConstraintModel;
	(ConstraintModel = function(args) {
		
		_.extend(this, args);
		_.bindAll(this, "parseMqlConstraints","parse", "getConstraints", "save", "setParameter", "getParameter", "deleteParameter");
		this.workspace = args.workspace;
		this.query = args.query;
		
		this.constraints = {};
		this.modelId =  null;
	    this.domainType = null;
	    this.domainId = null;
		this.parameters = {};

		this._frml = {
			condition: "",
			operator: ""
		};

		this.parseMqlConstraints();		
		
	}).prototype = {

		/*
		* Parses the constraints of an MQL-Query into this view-model
		*/
		parseMqlConstraints: function() {
			var that = this;
			var constraints = {};
			var mql = this.query.metadataQuery.getMql();
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

			//search the <parameters> to find default values
			$.each(mql.parameters, function(k,parameter) {
				for (var i = infos.length - 1; i >= 0; i--) {
					if(infos[i].param==parameter.name){
						infos[i].value = parameter.defaultValue;
					}
				};
				
			});
		},

		/*
		* Internal parser rules for open-forumla expressions in an MQL-Query. 
		* This one is more specialized and simple than PHOMP
		*/
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
			
			//Check for param [param:PARAM_NAME] in value
			var searchParam = new RegExp('\\[param:(.*?)\\]',["i"]);
			var result = searchParam.exec(cInfo.value);
			if(result) {
				cInfo.value = null; //This has to be the default value if it is a parameter. we need to find that in <parameter>
				cInfo.param = result[1];
			}

			var collectedInfo = {
				cInfo : cInfo,
				cName : columnInfos[1]					
			}
			return collectedInfo;
		},

		/*
		 * Get all constraints for a given metadata column
		 */
		 //TODO: Rename to getAllFiltersForColumn
		getConstraints: function(column) {	
			return this.constraints[column];
		},

		/*
		 *
		 */
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
			var searchParam = new RegExp('\\[param:(.*?)\\]',["i"]);
			var result = searchParam.exec(p2);
			if(result) {
				usedParams.push(result[1]);
			}
		return f;
		},

		/*
		*/
		//TODO: this is rather add than set
		setParameter: function(paramName,paramLabel,defaultVal,mqlQueryString, type) {

			var dataSource = null;

			if(typeof mqlQueryString !== "undefined"){
				dataSource = new reportDesigner.Datasource({
					id: "FILTER_" + paramName,
					type: DatasourceType.CDA,
					queryString: mqlQueryString
					}); 
			}

			var parameter = new reportDesigner.Parameter({
				name : paramName,
				label : paramLabel,
				dataSource: dataSource,
				defaultValue: defaultVal,
				type: type
			});

			this.parameters[paramName] = parameter;
			return true;
		},

		//Wer benutzt das?
		getParameter: function(paramName) {
			return this.parameters[paramName];
		},

		deleteParameter: function(paramName) {
			delete this.parameters[paramName];	
			return true;
		},

		/*
		* This renders the view-model into the reportmodel and the querymodel
		*/
		save: function() {
			var self = this;
			var usedParams = new Array();
			var constraintCollector = new Array();
			$.each(this.constraints, function() {
				$.each(this,function(){
					var formula = self.generateMqlFormula(this,usedParams)
					constraintCollector.push(formula);
				}); 
				
			});
			this.query.metadataQuery.config.mql.constraints = constraintCollector;
			//Clean Params
			$.each(this.parameters, function(k,v) {
				if(_.indexOf(usedParams,v.name) < 0){
					delete this;
				}else{
					var param = {
						name: v.name,
						type: v.type,
						defaultValue: v.defaultValue
					}
					self.query.metadataQuery.addParameter(param, _.indexOf(usedParams,v.name));
					self.query.reportSpec.addParameter(v);
				}
			});
		}

	};
	reportDesigner.ConstraintModel = ConstraintModel;
})();
