//Load additional html-templates
(function() {
    $.get('web/../js/saiku/plugins/ReportDesigner/templates.htm', function(templates) {
        $('body').append(templates);
    });
})();

var reportDesigner = reportDesigner || {};
    reportDesigner.mql = reportDesigner.mql || {};
var exports = reportDesigner.mql;

/*
 * Do all sorts of modification to the saiku app
 */
reportDesigner.Settings = {
    REPORTING_WEBAPP: "/saiku-reporting",
    //REPORTING_REST_MOUNT_POINT: "/rest/saiku/",
    REPORTING_REST_MOUNT_POINT: "../../../saiku-reporting-webapp/rest/saiku-adhoc/rest",
    METADATA_PREFETCH: true,
    RESOURCE_LOCATION: "/../resources/",
    START_WITH_REPORT: true,
    DRAG_RESIZE: false
    /*
    QUERY_PROPERTIES: {
        'saiku.reporting.automatic_execution': 'true'
    },
    */
}

Settings = _.extend(Settings, reportDesigner.Settings);

//Change to metadata Query model instead of olap
Query = reportDesigner.MetadataQuery;

//----Backbone super
(function(Backbone) {
 
// The super method takes two parameters: a method name
// and an array of arguments to pass to the overridden method.
// This is to optimize for the common case of passing 'arguments'.
function _super(methodName, args) {
 
// Keep track of how far up the prototype chain we have traversed,
// in order to handle nested calls to _super.
this._superCallObjects || (this._superCallObjects = {});
var currentObject = this._superCallObjects[methodName] || this,
parentObject = findSuper(methodName, currentObject);
this._superCallObjects[methodName] = parentObject;
 
var result = parentObject[methodName].apply(this, args || []);
delete this._superCallObjects[methodName];
return result;
}
 
// Find the next object up the prototype chain that has a
// different implementation of the method.
function findSuper(methodName, childObject) {
var object = childObject;
while (object[methodName] === childObject[methodName]) {
object = object.constructor.__super__;
}
return object;
}
 
_.each(["Model", "Collection", "View", "Router"], function(klass) {
Backbone[klass].prototype._super = _super;
});
 
})(Backbone);




