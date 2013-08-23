/*
 * WorkspaceToolbar.js
 * 
 * Copyright (c) 2011, Marius Giepz. All rights reserved.
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
var TemplatesModal = Modal.extend({
	type: "templates",

	buttons: [{
		text: "Save",
		method: "save"
	},{
		text: "Cancel",
		method: "close"
	}
	],

	events: {
		'click a': 'call',
		'change select' : 'changed'
	},

	initialize: function(args) {
		// Initialize properties
		_.extend(this, args);
		this.options.title = "Report Setup ";
		this.message = "Fetching Templates...";
		this.options.resizable = true;
		this.query = args.workspace.query;
		this.data = args;

		_.bindAll(this, "fetch_values", "populate", "finished","call","changed","page_portrait","page_landscape");

		// Resize when rendered
		this.bind('open', this.post_render);
		this.render();

		// Load template
		$(this.el).find('.dialog_body')
		.html(_.template($("#template-selection").html())(this));

		this.fetch_values();

	},
	call: function(event) {
		//Determine callback
		var callback = event.target.hash.replace('#', '');

		//Attempt to call callback
		if (! $(event.target).hasClass('disabled_toolbar') && this[callback]) {
			this[callback](event);
		}

		return false;
	},
	fetch_values: function() {
		var that = this;
		var jqxhr = $.get(Settings.REST_URL + "generator/templates",
			function(data) { 

				that.populate(data); });
	},
	
	populate: function(response) {

		var query = this.workspace.query;
		var that = this;
		var selected = 1;
		var i = 1;
		var template = query.reportSpec.template;
		var pageSetup = query.reportSpec.pageSetup;
		$carousel = $('#carousel');
		$carousel.jcarousel({
			visible: 3,
			size: response.length			
		});
		$('#template_name').html(template.name);
		
		$('#selectedFormat').empty();
		$.each(pageSetup.formatList, function() {
			$('#selectedFormat').append( new Option(arguments[1],arguments[1]) );
		});

		$(this.el).find("input[name=margin-top]").val(pageSetup.marginTop);
		$(this.el).find("input[name=margin-bottom]").val(pageSetup.marginBottom);
		$(this.el).find("input[name=margin-left]").val(pageSetup.marginLeft);
		$(this.el).find("input[name=margin-right]").val(pageSetup.marginRight);
		
		$("#selectedFormat option[value='" + pageSetup.pageFormat + "']").attr('selected', 'selected');

		$.each(response, function() {
			var name = this.name;
			var url = this.url;

			if(name == template.name) {
				selected = i;
			}
			var nameInfo = name.split('.');
			var shortName = nameInfo[0];
			$carousel.jcarousel('add', i,'<li id="'+ shortName +'" class="jcarousel-item-'+i+'" style="overflow: hidden; float: left; width: 75px; height: 75px;"><img src="'+Settings.REST_URL + 'generator/image/' + shortName + '.png" width="75" height="75" alt="" /></li>'
			);
			i++;
		});
		$("li.jcarousel-item.selected").removeClass('selected');
		var selectedImage = $("li.jcarousel-item-"+selected).addClass("selected");

		$("#carousel").delegate("li", "click", function() {
			$("li.jcarousel-item.selected").removeClass('selected');
			var clickedItem = $(this).attr('id');
			var clickedIndex = $(this).attr('jcarouselindex');
			$("li.jcarousel-item-"+clickedIndex).addClass('selected');
			var collectedTemplates = $.grep(response, function(source) {
				var nameInfo = source.name.split('.');
				var name = nameInfo[0];
				return (name == clickedItem);
			});
			if(!_.isEmpty(collectedTemplates)){
				var newTemplate = collectedTemplates[0];
				$('#template_name').html(newTemplate.name);
				that.query.reportSpec.template = newTemplate;
			}
		});
		
		/*
		if(this.json.orientation==0) {
			$(this.el).find('.landscape').addClass('on');
		} else {
			$(this.el).find('.portrait').addClass('on');
		};
		*/
		// Show dialog
		//Application.ui.unblock();

	},
	post_render: function(args) {
    	this.center();

	},
	changed: function(event) {
		var that = this;
		return false;
	},
	page_landscape: function(event) {
		$(this.el).find('.landscape').addClass('on');
		$(this.el).find('.portrait').removeClass('on');
		this.json.orientation = 0;
	},
	page_portrait: function(event) {
		$(this.el).find('.landscape').removeClass('on');
		$(this.el).find('.portrait').addClass('on');
		this.json.orientation = 1;
	},
	save: function() {

        this.json.pageFormat = $(this.el).find('#selectedFormat option:selected').val();
        
		this.json.marginTop = $(this.el).find("input[name=margin-top]").val();
		this.json.marginBottom = $(this.el).find("input[name=margin-bottom]").val();
		this.json.marginLeft = $(this.el).find("input[name=margin-left]").val();
		this.json.marginRight = $(this.el).find("input[name=margin-right]").val();

		
		// Notify server
		this.query.action.post('/SETTINGS', {
			success: this.finished,
			data: this.json// JSON.stringify(values)
		});

		return false;

	},
	finished: function() {
		$(this.el).dialog('destroy').remove();
		this.query.page=null;
		this.query.run();

	}
});