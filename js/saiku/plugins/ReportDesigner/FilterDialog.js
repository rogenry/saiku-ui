// /*
//  * SelectionsModal.js
//  * Copyright (c) 2011, Marius Giepz, OSBI Ltd. All rights reserved.
//  *
//  * This library is free software; you can redistribute it and/or
//  * modify it under the terms of the GNU Lesser General Public
//  * License as published by the Free Software Foundation; either
//  * version 2.1 of the License, or (at your option) any later version.
//  *
//  * This library is distributed in the hope that it will be useful,
//  * but WITHOUT ANY WARRANTY; without even the implied warranty of
//  * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
//  * Lesser General Public License for more details.
//  *
//  * You should have received a copy of the GNU Lesser General Public
//  * License along with this library; if not, write to the Free Software
//  * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
//  * MA 02110-1301  USA
//  */

// var FilterDialog = Modal.extend({
    
//     type: "simpleFilterDialog",

//     buttons: [
//         {
//             text: "Save",
//             method: "save"
//         },
//         {
//             text: "Cancel",
//             method: "close"
//         }
//     ],

//     events: {
//         'click a': 'call'
//     },

//     initialize: function (args) {

//         this.options.title = "Report Filters";

//         _.extend(this, args);

//         // this.workspace = args.workspace;
//         // this.key = args.key;
//         // this.index = args.index;

//         this.filterRows = [];
//         _.bindAll(this, "_filterNew", "_filterEdit");

//         // Resize when rendered
//         this.bind('open', this.post_render);
//         this.render();

//         var template = _.template($("#template-filter-dialog").html())(this);

//         $(this.el).find('.dialog_body').html(template);

//         if (args.action == "new") {
//             this._filterNew();
//         } else {
//             this._filterEdit();
//         }

//         // Show dialog
//         Saiku.ui.unblock();
//         $(this.el).parent().find('.ui-dialog-titlebar-close').bind('click', this.close);

//     },

//     _filterNew: function () {
//         var columnMeta = this.workspace.query.selectedModel.getColumnByPath(this.key);
//         this.workspace.filterModel.addFilter(columnMeta, this.index);
//         this._filterEdit();
//         return;
//     },

//     _filterEdit: function () {

//         for (var i = 0; i < this.workspace.filterModel.filters.length; i++) {
//             var filter = this.workspace.filterModel.filters[i];
//             var oType = i==0 ? "HEAD": "FOLLOW";
//             this.filterRows.push(
//                 new FilterRow({
//                     el: $(this.el).find('.simple_filter_row'),
//                     workspace: this.workspace,
//                     model: filter,
//                     operatorType: oType,
//                     index: i
//             }));
//             console.log(i);
//         }
//     },

//     post_render: function (args) {
//         $(args.modal.el).parents('.ui-dialog').css({
//             width: "905px"
//         });
//     },

//     save: function () {
//         for (var i = 0; i < this.filterRows.length; i++) {
//             this.filterRows[i].storeFilterValues(
//                 this.workspace.filterModel.filters[i]);
//         }
//         this.finished();
//     },

//     close: function () {
//         //TODO: remove recently added row? maybe not
//         $(this.el).dialog('destroy').remove();
//     },

//     finished: function () {
//         $(this.el).dialog('destroy').remove();
//         this.workspace.query.run();
//     }
// });