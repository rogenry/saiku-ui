/*Some static stuff, dunno where to put it*/

//check if that stuff here is still necessary //MG//
var Constants = {
	horizontalAlignments: ["LEFT","CENTER","RIGHT"],
	verticalAlignments: ["TOP","CENTER","BOTTOM"]
}    

var AggTypes = {
   "NONE" : "None",
   "SUM" : "Sum",
   "AVERAGE" : "Average",
   "COUNT" : "Count",
   "COUNT_DISTINCT" : "Count Distinct",
   "MINIMUM" : "Minimum",
   "MAXIMUM" : "Maximum"
}

var defaultCalcColumn =
{"name":"Calculated Column",
"id":"NEW",
"description":"",
"formula" : "\"Formula\"",
"category":"CALCULATED",
"sort":"NONE",
"fieldType":"",
"uid":null,
"defaultAggType":"NONE",
"elementFormat":
	{"horizontalAlignment":"LEFT",
	"verticalAlignment":"CENTER",
	"fontName":null,
	"fontColor":null,
	"backgroundColor":null,
	"fontSize":null
	},
"columnHeaderFormat":
	{"horizontalAlignment":null,
	"verticalAlignment":null,
	"fontName":null,
	"fontColor":null,
	"backgroundColor":null,
	"fontSize":null
	},
"aggTypes":["NONE"],
"selectedAggType":"NONE",
"formatMask":null,
"selectedSummaryType":"NONE"
};

var emptyFormat =
{
    "value": null,
    "format": {
        "width": null,
        "horizontalAlignment": null,
        "verticalAlignment": null,
        "fontName": null,
        "fontColor": null,
        "backgroundColor": null,
        "fontBold": null,
        "fontItalic": null,
        "fontSize": null,
        "fontUnderlined": null,
        "paddingLeft": null,
        "paddingRight": null
    }
}