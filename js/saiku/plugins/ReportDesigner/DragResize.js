/*
 * DragResize.js
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

var DragResize = Backbone.View.extend({

	initialize: function(args) {

		this.workspace = args.workspace;

		this.dragging = false;

		_.bindAll(this, "render", "summonDragResize", "banishDragResize");

	},
	render: function() {

		//The resize-area
		$(this.el).append('<div id="resizearea" class="resize resize_region"/>');
		$('#resizearea').hide();

		//the drag-handle
		$('#resizearea').append('<div id="draghandle" class="resize resize_horizontal"/>');
		$('#draghandle').css('display', 'none')

		$('#resizearea').mouseover(function() {
			if(!this.dragging == true) $('#draghandle').css('display', 'block');
		});
		$('#resizearea').mouseout(function() {
			if(!this.dragging == true) $('#draghandle').css('display', 'none'); //.css('margin-top', '-2px');
		});
	},
	summonDragResize: function(event) {

		if(!this.dragging == true && !$(event.currentTarget).parent().children('.saiku').last().is($(event.currentTarget))) {

			var self = this;
			var colHeader = $(event.currentTarget);

			var colHeaderPos = colHeader.position();
			var colHeaderWidth = colHeader.width();
			var colHeaderHeight = colHeader.height();
			var areaWidth = $('#resizearea').width();
			var padding = parseInt(colHeader.css('padding-right').replace("px", ""));

			$('#resizearea').css('top', colHeaderPos.top);
			$('#resizearea').css('left', 12 + colHeaderPos.left + colHeaderWidth - areaWidth + (2 * padding));
			$('#resizearea').css('height', 8 + colHeaderHeight);

			$('#resizearea').show();

			$(event.currentTarget).parent().addClass('resizable_row');

			var borderPosition = $('.workspace_report_canvas').position();
			var borderHeight = $('.workspace_report_canvas').height();
			var borderTop = borderPosition.top;

			//calculate the containment
			var td_elements = $(event.currentTarget).add($(event.currentTarget).next("td"));

			//This will hold the extreme points of the containment
			var points = {
				left: td_elements.eq(0).position().left,
				top: td_elements.eq(0).position().top,
				right: 0,
				bottom: 0
			};

			//Find the points of the containment
			td_elements.each(function() {
				console.log($(this).attr('class'));

				var t = $(this);
				var p = t.position();
				var width = t.width();
				var height = t.height();

				points.left = Math.min(p.left, points.left);
				points.top = Math.min(p.top, points.top);
				points.right = Math.max(points.right, p.left + width);
				points.bottom = Math.max(points.bottom, p.top + height);
			});
			
			$helper = $('#resizer').addClass('resizer').css({height : borderHeight - 10, top: borderTop}); //,{top: borderTop});

			//it sometimes mixes up the one that is being dragged with its neighbor

			$('#draghandle').css('height', 8 + colHeaderHeight).draggable({
				helper: function() {
					return $helper.clone().removeAttr("id").removeClass("hide");
				},
				//delay: 1500,
				grid: [5, 20],
				containment: [points.left + 30, points.top, points.right - 30, points.bottom],
				axis: 'x',
				start: function(event, ui) {
					$(ui.helper).css({
						top: borderTop - points.top
					});
					console.log("start dragging");
					self.dragging = true;
				},
				dragging: function(event, ui) {
					event.stopPropagation();
				},
				stop: function(event, ui) {
					console.log("start dragging");
					self.dragging = false;

					var $ele = $('.resizable_row');
					var containmentWidth = $ele.width();

					var delta = ui.position.left - ui.originalPosition.left;
					var one = 100 / containmentWidth;
					var prcChange = one * delta;

					var clazz = colHeader.attr('class').split(/\s+/);

					var elementClass;

					//find the relevant class
					for(var i = 0; i < clazz.length; i++) {
						var c = clazz[i];
						if(c.substring(0, 3) == "rpt") {
							elementClass = c;
							break;
						}
					}

					//calculate the new width using prcChange and put it in the  model
					var detailId = elementClass.replace('dth','dtl') + "-x-x";
					var format = self.workspace.serverReportSpec.getElementFormatById(detailId);
					var width = format.width;
					var oldWidthValue = width.value;
					//var newWidthValue = oldWidthValue * (100 + prcChange)/100;
					var newWidthValue = oldWidthValue + prcChange;
					console.log("resized width ->" + newWidthValue);
					//This does the trick, thnx jganoff ;)
					var correctWidthValue = Math.max(1, Math.min(100, Math.round(newWidthValue * 1000) / 1000));
					width.value = correctWidthValue;
					self.workspace.reportSpec.setElementFormatPropertyById(detailId,'width',width);
					self.workspace.query.run();
				}
			});

		}

	},
	banishDragResize: function(event) {

		if(!this.dragging == true) {

			var el = event.relatedTarget;
			var _position = $(el).offset()
			var height = $(el).height()
			var width = $(el).width()
			if(
				event.pageY > _position.top ||
				event.pageY < (_position.top + height) || 
				event.pageX > _position.left || 
				event.pageX < (_position.left + width)
			) {
				return true;
			}

			$('#resizearea').hide();

		}
	}
});






/*





(function ($) {
    $.fn.jqDrag = function (h) {
        return i(this, h, 'd');
    };
    $.fn.jqResize = function (h) {
        return i(this, h, 'r');
    };
    $.jqDnR = {
        dnr: {},
        e: 0,
        drag: function (v) {
            if (M.k == 'd') E.css({
                    left: M.X + v.pageX - M.pX,
                    top: M.Y + v.pageY - M.pY
                });
            else E.css({
                    width: Math.max(v.pageX - M.pX + M.W, 0),
                    height: Math.max(v.pageY - M.pY + M.H, 0)
                });
            return false;
        },
        stop: function () {
            E.css('opacity', M.o);
            $().unbind('mousemove', J.drag).unbind('mouseup', J.stop);
        }
    };
    var J = $.jqDnR,
        M = J.dnr,
        E = J.e,
        i = function (e, h, k) {
            return e.each(function () {
                h = (h) ? $(h, e) : e;
                h.bind('mousedown', {
                    e: e,
                    k: k
                }, function (v) {
                    var d = v.data,
                        p = {};
                    E = d.e;
                    // attempt utilization of dimensions plugin to fix IE issues
                    if (E.css('position') != 'relative') {
                        try {
                            E.position(p);
                        } catch (e) {}
                    }
                    M = {
                        X: p.left || f('left') || 0,
                        Y: p.top || f('top') || 0,
                        W: f('width') || E[0].scrollWidth || 0,
                        H: f('height') || E[0].scrollHeight || 0,
                        pX: v.pageX,
                        pY: v.pageY,
                        k: d.k,
                        o: E.css('opacity')
                    };
                    E.css({
                        opacity: 0.8
                    });
                    $().mousemove($.jqDnR.drag).mouseup($.jqDnR.stop);
                    return false;
                });
            });
        },
        f = function (k) {
            return parseInt(E.css(k)) || false;
        };
})(jQuery);

.jqHandle {
   background: red;
   height:15px;
}

.jqDrag {
  width: 100%;
  cursor: move;
}

.jqResize {
   width: 15px;
   position: absolute;
   bottom: 0;
   right: 0;
   cursor: se-resize;
}

.jqDnR {
    z-index: 3;
    position: relative;
    
    width: 180px;
    font-size: 0.77em;
    color: #618d5e;
    margin: 5px 10px 10px 10px;
    padding: 8px;
    background-color: #EEE;
    border: 1px solid #CCC;
}

*/