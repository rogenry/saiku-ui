/*
 * ElementFormatPanel.js
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
/*
 * The report format editor
 */
var ElementFormatPanel = Backbone.View.extend({

	id: "format",

	events: {
		'click a': 'call',
		'change .sizeSelector select' : 'size_select',
		'change .fontSelector select' : 'font_select'
	},

	initialize: function(args) {

		this.workspace = args.workspace;

		this.workspace.bind('query:report', this.enable_template_button);

		_.extend(this, args);
		_.extend(this, Backbone.Events);

		_.bindAll(this, "render","reflect_format","fetch_values","save","call", "disable_buttons", "enable_buttons", "finished",
				"align_left","align_center","align_right","textcolor_callback","size_select","enable_template_button"			
		);

	},

	template: function() {
		return _.template($("#format-editor").html())();
	},
	
	element_format: function() {
			var targetElements = $('.adhoc-highlight').toArray();
			var targetElementIdList = new Array();
			$.each(targetElements, function() {
				targetElementIdList.push($(this).attr('id'));
			});
			return _.uniq(targetElementIdList);
	},

	textcolor_callback: function(panel) {
		return function (color){
			$.each(panel.element_format(), function() { 
				panel.reportSpec.setElementFormatPropertyById(this,'fontColor',color.toHexString());
			});
			panel.save();
		}
	},

	bgcolor_callback: function(panel) {
	return function (color){
			$.each(panel.element_format(), function() {  
				panel.reportSpec.setElementFormatPropertyById(this,'backgroundColor',color.toHexString());
			});
			panel.save();
		}
	},

	font_callback: function(panel) {
		return function(event){
			panel.reportSpec.setElementFormatPropertyById(panel.element,'fontName',$(event.target).val());		
			panel.save();
		}
	},

	font_select: function(event){
		var panel = this;
		$.each(panel.element_format(), function() { 
			panel.reportSpec.setElementFormatPropertyById(this,'fontName',$(event.target).val());		
		});
		this.save();
	},

	size_select: function(event){
		var panel = this;
		$.each(panel.element_format(), function() {  
			panel.reportSpec.setElementFormatPropertyById(this,'fontSize',$(event.target).val());		
		});
		this.save();
	},

	render: function() {

		$(this.el).html(this.template());

		this.oFontpicker = $(this.el).find('.fontPicker').fontPicker({bgColor: '#ffffee'});

		$(this.el).find('#fontPickerInput').change(this.font_callback(this));

		/*$(this.el).find('.text-color').ColorPicker({
			color: '#0000ff',
			onShow: function (colpkr) {
				$(colpkr).fadeIn(500);
				return false;
			},
			onHide: function (colpkr) {
				$(colpkr).fadeOut(500);
				return false;
			},
			onSubmit: this.textcolor_callback(this)
		});*/

		$(this.el).find('#text-color').spectrum({
				change: this.textcolor_callback(this)
		});
		
		$(this.el).find('#background-color').spectrum({
				change: this.bgcolor_callback(this)
		});

//		TODO: move to a template
		var $fontSize = $(this.el).find('.sizeSelector')
		.append('&nbsp;<select> \
				<option value="6">6</option> \
				<option value="8">8</option> \
				<option value="9">9</option> \
				<option value="10">10</option> \
				<option value="11">11</option> \
				<option value="12">12</option> \
				<option value="13">13</option> \
				<option value="14">14</option> \
				<option value="15">15</option> \
				<option value="16">16</option> \
				<option value="17">17</option> \
				<option value="18">18</option> \
				<option value="20">20</option> \
				<option value="22">22</option> \
				<option value="24">24</option> \
				<option value="28">28</option> \
				<option value="32">32</option> \
		</select>');

		this.disable_buttons();

		return this;
	},
	
	disable_buttons: function(){
		$(this.el).find('.button').not('.templates').not('.page').removeClass('on').addClass('disabled_editor');
		$(this.el).find('select').attr('disabled', 'disabled');
		$(this.el).find('.fontPicker').fontPicker('option', 'disabled', true);
	},


	enable_template_button: function(){
		$(this.el).find('.button.templates').removeClass('disabled_editor');
		$(this.el).find('.button.page').removeClass('disabled_editor');
	},

	enable_buttons: function(){
		$(this.el).find('.fontPicker').fontPicker('option', 'disabled', false);
		$(this.el).find('select').removeAttr('disabled');
		$(this.el).find('.button').removeClass('disabled_editor');		
	},

	reflect_format: function(format){
	
		this.query = this.workspace.query;
		//this.reportSpec =  this.query.reportSpec;
		
		this.enable_buttons();

		var horzAlignment = format.horizontalAlignment.toLowerCase();
		$(this.el).find('.horz.align-' + horzAlignment).addClass('on');

		var vertAlignment = format.verticalAlignment.toLowerCase();
		$(this.el).find('.vert.align-' + vertAlignment).addClass('on');

		$(this.el).find('.sizeSelector select').val(format.fontSize);

		$(this.el).find('.fontSelector select').val(format.fontName);

		$(this.el).find('.fontPicker').fontPicker('option', 'defaultFont', format.fontName);

		if(format.fontBold){
			$(this.el).find('.fontstyle-bold').addClass('on');
		}
		if(format.fontItalic){
			$(this.el).find('.fontstyle-italic').addClass('on');
		}
		if(format.fontUnderline){
			$(this.el).find('.fontstyle-udl').addClass('on');
		}
		
		var that = this;

		//TODO: Here I have to know what the value is
		//i.e. Label->value or DataField->fieldNames
		//this has to be passed in here too!

		var inplaceEditDelegate = {
				willOpenEditInPlace: function(aDOMNode, aSettingsDict) {
					return that.workspace.serverReportSpec.getValueById(that.element);
				}
		};
		
		$('.report_inner').one('click', function(evt) {
			if (evt.target == this) {
				$('.saiku').removeClass('adhoc-highlight');		
        		$(this).find('#dragzone').fadeOut('slow').remove();
        		that.disable_buttons();	
    		}
		});
		
		$('.report_border').click(function(e) {
			e.stopPropagation();
		});
		
		$('.report_border').mouseout(function(){
			$('.saiku').removeClass('report-hover');		
		});
		
		/*
		 * Inplace edit for column headers
		 */		
		$('.adhoc-highlight').each(function(){
			//Details should not be click-editable
			if(!($(this).attr('class').indexOf('rpt-dtl') > -1)){
				$(this).editInPlace({
					preinit: function(){
						if(that.isEditing) return false;
						that.isEditing = true;
					},
					callback: function(unused, enteredText) {
						that.query.reportSpec.setValueById(that.element, enteredText);	
						that.isEditing=false;
						that.finished();
						return true;
					},
					delegate: inplaceEditDelegate,		
					default_text: function(){return that.workspace.serverReportSpec.getValueById(that.element)},
					select_text: function(){return that.workspace.serverReportSpec.getValueById(that.element)},
					save_if_nothing_changed: true,
					select_options: "selected:disabled"
				});
				}
			}
		);
	},

	fetch_values: function(id, type) {

		if(this.isEditing) return false;

		this.element = id;

		this.format = this.workspace.serverReportSpec.getElementFormatById(id);

		this.reflect_format(this.format);

	},

	save: function() {

		//TODO: This is a dirty hack
		//this.reportSpec.setElementFormatPropertyById(this.element,'width',null);			???
		//this.finished();
		this.query.run();
		
		return false;
	},
	
	finished: function(response) {	
		this.query.run();
	},

	call: function(event) {
		//Determine callback
		var callback = event.target.hash.replace('#', '');

		//Attempt to call callback
		if (! $(event.target).hasClass('disabled_editor') && this[callback]) {
			this[callback](event);
		}

		return false;
	},

	select_templates: function(event) {
		 (new TemplatesModal({
            workspace: this.workspace
        })).open();
	},

	//--------DAS STIMMT NOCHNICH
	
	padding_inc: function(event) {
		this.json.format.paddingLeft += 5;
		this.json.format.paddingRight += 5;
		this.save(this.json);
	},

	padding_dec: function(event) {
		this.json.format.paddingLeft -= 5;
		this.json.format.paddingRight -= 5;
		if(this.json.format.paddingLeft < 0) {
			this.json.format.paddingLeft = 0;
		} 
		if(this.json.format.paddingRight < 0) {
			this.json.format.paddingRight = 0;
		} 
		this.save(this.json);
	},

	//-----------------------------------------
	
	align_left: function(event) {
		var panel = this;
		$.each(panel.element_format(), function() {  
			panel.query.reportSpec.setElementFormatPropertyById(this,'horizontalAlignment',
			HorizontalElementAlignment.LEFT);
		});
		this.save();
	},

	align_center: function(event) {
		var panel = this;
		$.each(panel.element_format(), function() {  
			panel.query.reportSpec.setElementFormatPropertyById(this,'horizontalAlignment',
			HorizontalElementAlignment.CENTER);		
		});
		this.save();
	},

	align_right: function(event) {
		var panel = this;
		$.each(panel.element_format(), function() {  
			panel.query.reportSpec.setElementFormatPropertyById(this,'horizontalAlignment',
			HorizontalElementAlignment.RIGHT);
		});
		this.save();
	},

	align_top: function(event) {
		var panel = this;
		$.each(panel.element_format(), function() {  
			panel.query.reportSpec.setElementFormatPropertyById(this,'verticalAlignment',
			VerticalElementAlignment.TOP);		
		});
		this.save();
	},

	align_middle: function(event) {
		var panel = this;
		$.each(panel.element_format(), function() {  
			panel.query.reportSpec.setElementFormatPropertyById(this,'verticalAlignment',
			VerticalElementAlignment.MIDDLE);
		});
		this.save();
	},

	align_bottom: function(event) {
		var panel = this;
		$.each(panel.element_format(), function() {  
			panel.query.reportSpec.setElementFormatPropertyById(this,'verticalAlignment',
			VerticalElementAlignment.BOTTOM);
		});
		this.save();
	},

	fontstyle_bold: function(event) {

		$(this.el).find('.fontstyle-bold').toggleClass('on');
		var panel = this;
		
		if($(this.el).find('.fontstyle-bold').hasClass('on')){
			$.each(panel.element_format(), function() {  
				panel.query.reportSpec.setElementFormatPropertyById(this,'fontBold',true);
			});
		}else{
			$.each(panel.element_format(), function() {
				panel.query.reportSpec.setElementFormatPropertyById(this,'fontBold',false);	
			});
		}
		this.save();
	},

	fontstyle_italic: function(event) {

		$(this.el).find('.fontstyle-italic').toggleClass('on');
		var panel = this;
		
		if($(this.el).find('.fontstyle-italic').hasClass('on')){
			$.each(panel.element_format(), function() {
			panel.query.reportSpec.setElementFormatPropertyById(this,'fontItalic',true);		
			});
		}else{
			$.each(panel.element_format(), function() {
				panel.query.reportSpec.setElementFormatPropertyById(this,'fontItalic',false);
			});
		}
		this.save();
	},

	fontstyle_udl: function(event) {

		$(this.el).find('.fontstyle-udl').toggleClass('on');
		var panel = this;
		
		if($(this.el).find('.fontstyle-udl').hasClass('on')){
			$.each(panel.element_format(), function() {
				panel.query.reportSpec.setElementFormatPropertyById(this,'fontUnderline',true);		
			});
		}else{
			$.each(panel.element_format(), function() {
				panel.query.reportSpec.setElementFormatPropertyById(this,'fontUnderline',false);
			});
		}
		this.save();
	}
	
});
