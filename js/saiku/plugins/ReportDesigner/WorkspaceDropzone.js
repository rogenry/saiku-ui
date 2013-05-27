var reportDesigner = reportDesigner || {};

reportDesigner.WorkspaceDropZone = WorkspaceDropZone.extend({

    template: function() {
        var template = $("#template-report-dropzones").html() || "";
        return _.template(template)();
    },

    render: function() {

        this._super("render", arguments);


        console.log('dropzones=' + this.workspace.mode);
        if(this.workspace.mode === 'crosstab') {
            $(this.el).find('.fields_list[title=REL_GROUPS]').hide();
        } else {
            $(this.el).find('.fields_list[title=COL_GROUPS]').hide();
            $(this.el).find('.fields_list[title=ROW_GROUPS]').hide();
        }

        //Droprules: Prevent calculated columns from being dropped 
        $(this.el).find('.filters ul').bind("sortreceive", function(event, ui) {
            if($(ui.item).hasClass('calculated') || $(ui.item).find('span').hasClass('sort')) {
                $(ui.sender).sortable('cancel');
            }
        });
        $(this.el).find('.relgroups ul').bind("sortreceive", function(event, ui) {
            if($(ui.item).hasClass('calculated') || $(ui.item).find('span').hasClass('sprite')) {
                $(ui.sender).sortable('cancel');
            }
        });
        $(this.el).find('.colgroups ul').bind("sortreceive", function(event, ui) {
            if($(ui.item).hasClass('calculated') || $(ui.item).find('span').hasClass('sprite')) {
                $(ui.sender).sortable('cancel');
            }
        });
        $(this.el).find('.rowgroups ul').bind("sortreceive", function(event, ui) {
            if($(ui.item).hasClass('calculated') || $(ui.item).find('span').hasClass('sprite')) {
                $(ui.sender).sortable('cancel');
            }
        });
        $(this.el).find('.measures ul').bind("sortreceive", function(event, ui) {
            if($(ui.item).find('span').hasClass('sprite')) {
                $(ui.sender).sortable('cancel');
            }
        });

    },

    sort_measure: function(event, ui) {

        var sortOrder = "";
        if ($(event.target).hasClass('none')) sortOrder = "none";
        if ($(event.target).hasClass('BASC')) sortOrder = "BASC";
        if ($(event.target).hasClass('BDESC')) sortOrder = "BDESC";

        var futureSortOrder = "none";
        if (sortOrder == "none") futureSortOrder = "BASC";
        if (sortOrder == "BASC") futureSortOrder = "BDESC";
        if (sortOrder == "BDESC") futureSortOrder = "none";
        
        $(event.target).removeClass('BASC').removeClass('BDESC').removeClass('none').addClass(futureSortOrder);

        this.workspace.query.run();   
    },

    select_dimension: function(event, ui) {

        $axis = ui.item.parents('.fields_list_body');
        var target = "";

        if($axis.hasClass('measures')) target = "MEASURES";
        if($axis.hasClass('relgroups')) target = "REL_GROUPS";
        if($axis.hasClass('colgroups')) target = "COL_GROUPS";
        if($axis.hasClass('rowgroups')) target = "ROW_GROUPS";
        if($axis.hasClass('filters')) target = "FILTERS";

        // Short circuit if this is a move
        if (ui.item.hasClass('d_measure') ||
                ui.item.hasClass('d_dimension')) {
            this.move_dimension(event, ui, target);
            return;
        }

        // Make the element and its parent bold
        var original_href = ui.item.find('a').attr('href');
        var $original = $(this.workspace.el).find('.sidebar')
            .find('a[href="' + original_href + '"]').parent('li');
        $original
            .css({fontWeight: "bold"})
            .draggable('disable');
        $original.parents('.parent_dimension')
            .find('.folder_collapsed')
            .css({fontWeight: "bold"});

        // Wrap with the appropriate parent element
        var initialSort = 'none'; 
        if(target == "REL_GROUPS" || target == "COL_GROUPS" || target == "ROW_GROUPS"){
            initialSort = 'BASC';
        }
        var $icon = $("<div />").addClass('sprite').addClass('selections');
        var $icon2 = $("<span />").addClass('sprite').addClass('sort').addClass(initialSort);
        ui.item.addClass('d_dimension').prepend($icon);
        ui.item.addClass('d_dimension').prepend($icon2);

        //MG// Todo: We must presort on the groups

        var member = ui.item.find('a').attr('href').replace('#', '');
        var dimension = member.split('/')[3];  //MG
        var dimensions = [];

        //this.update_selections(event,ui); //MG// What is this for?

        $axis.find('a').each( function(i,element) {
            var imember = $(element).attr('href');
            var idimension = imember.replace('#', '').split('/')[3];  //MG 
            if (dimensions.indexOf(idimension) == -1) {
                dimensions.push(idimension);
            }
        });

        var index = dimensions.indexOf(dimension);

        var uuid = _.uniqueId('uid-');

        ui.item.attr('id', uuid);
        
        // Notify the model of the change
        this.workspace.query.move_dimension(member, 
                target, undefined, index, uuid);

        ui.item.css({
            fontWeight: "normal"
        });

        // Prevent workspace from getting this event
        return true;
    },

    update_selections: function(){
        //do nothing in saiku-metadata
        return true;
    },

    move_dimension: function(event, ui, target) {
        if (! ui.item.hasClass('deleted')) {
            $axis = ui.item.parents('.fields_list_body');

            // Notify the model of the change
            var dimension = ui.item.find('a').attr('href').replace('#', '').split('/')[3];
            var dimensions = [];

            this.update_selections(event,ui);

            $axis.find('a').each( function(i,element) {
                var imember = $(element).attr('href');
                var idimension = imember.replace('#', '').split('/')[3]; //???
                if (dimensions.indexOf(idimension) == -1) {
                    dimensions.push(idimension);
                }
            });
            var index = dimensions.indexOf(dimension);
            var indexFrom = ui.item.attr('indexFrom'); //MG//
            var uuid = ui.item.attr('id');

            this.workspace.query.move_dimension(dimension, 
                    target, indexFrom, index, uuid);
        }

        //MG// Reassign icon, could be moved to update_selections
        var title = ui.item.parents('.fields_list').attr('title');
        if(title == 'REL_GROUPS' || title == 'COL_GROUPS' || title == 'ROW_GROUPS') {
            ui.item.find('span').removeClass('sprite').addClass('sort').addClass('asc');
        } else if(title == 'MEASURES') {
            ui.item.find('span').removeClass('sprite').addClass('sort').addClass('none');
        } else {
            ui.item.find('span').removeClass('sort').addClass('sprite');
        }
        
        // Prevent workspace from getting this event
        event.stopPropagation();
        return false;
    },

    remove_dimension: function(event, ui) {
        // Reenable original element
        var $source = ui ? ui.draggable : $(event.target).parent();
        var original_href = $source.find('a').attr('href');
        var $original = $(this.workspace.el).find('.sidebar')
            .find('a[href="' + original_href + '"]').parent('li');
        $original
            .draggable('enable')
            .css({ fontWeight: 'normal' });
        
        // Unhighlight the parent if applicable
        if ($original.parents('.parent_dimension')
                .children().children('.ui-state-disabled').length === 0) {
            $original.parents('.parent_dimension')
                .find('.folder_collapsed')
                .css({fontWeight: "normal"});
        }

        // Notify server
        var target = '';
        var dimension = original_href.replace('#', '');
        $target_el = $source.parent().parent('div.fields_list_body');
        if($target_el.hasClass('measures')) target = "MEASURES";
        if($target_el.hasClass('relgroups')) target = "REL_GROUPS";
        if($target_el.hasClass('colgroups')) target = "COL_GROUPS";
        if($target_el.hasClass('rowgroups')) target = "ROW_GROUPS";
        if($target_el.hasClass('filters')) target = "FILTERS";

        var index = $target_el.find('li.ui-draggable').index(
        $target_el.find('a[href="#' + dimension + '"]').parent());

        this.workspace.query.remove_dimension(target, index);

        // Remove element
        $source.addClass('deleted').remove();
        
        // Prevent workspace from getting this event
        event.stopPropagation();
        event.preventDefault();
        return false;
    },

    selections: function(event, ui) {
        // Determine dimension
        var $target = $(event.target).hasClass('sprite') ? $(event.target).parent().find('.dimension') : $(event.target);
        var key = $target.attr('href').replace('#', '');

        var $li = $target.parent('.ui-draggable');
        var index = $li.parent('.connectable').children().index($li);

        var target = '';
        var $source = ui ? ui.draggable : $(event.target).parent();
        $target_el = $source.parent().parent('div.fields_list_body');
        if($target_el.hasClass('measures')) target = "MEASURES";
        if($target_el.hasClass('relgroups')) target = "REL_GROUPS";
        if($target_el.hasClass('colgroups')) target = "COL_GROUPS";
        if($target_el.hasClass('rowgroups')) target = "ROW_GROUPS";
        if($target_el.hasClass('filters')) target = "FILTERS";

        if(target == 'MEASURES') {
           if(key.indexOf("CALCULATED") !== -1) {
                // Launch column config dialog
                (new CalculatedColumnConfigModal({
                    target: $target,
                    index: index,
                    name: $target.text(),
                    key: key,
                    workspace: this.workspace
                })).open();
            } else {
                (new ColumnConfigModal({
                    target: $target,
                    index: index,
                    name: $target.text(),
                    key: key,
                    workspace: this.workspace
                })).open();
            }
        }else if(target  == 'FILTERS'){

            console.log("edit Filter");

            var constraint = this.workspace.metadataQuery.getConstraint(index);
            var filterModel = reportDesigner.mql.FilterController.formulaConstraintToFilterModel(constraint, this.workspace.query);

            (new SimpleFilterDialog({
                filterModel: filterModel,
                workspace: this.workspace
            })).open();
      }

        // Prevent default action
        try {
            event.preventDefault();
        } catch(e) {}
        return false;
    }

});

WorkspaceDropZone = reportDesigner.WorkspaceDropZone;


