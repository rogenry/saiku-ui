/*  
 *   Copyright 2012 OSBI Ltd
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

/**
 * Object which handles sessionworkspace and stores connections and cubes
 * @param username
 * @param password
 * @returns {Session}
 */
var reportDesigner = reportDesigner || {};

reportDesigner.SessionWorkspace = SessionWorkspace.extend({

    process_datasources: function(model, response) {
        if(typeof localStorage !== "undefined" && localStorage && localStorage.getItem('session') === null) {
            localStorage.setItem('session', JSON.stringify(response));
        }
        // Generate model navigation for reuse
        this.cube_navigation = _.template($("#template-md-models").html())({
            mdModelInfos: response
        });

        // Create domain objects
        this.mdModels = {};
        this.mdModelInfos = response;
        _.delay(this.prefetch_dimensions, 200);

        if(!this.initialized) {
            // Show UI
            $(Saiku.toolbar.el).prependTo($("#header"));
            $("#header").show();
            Saiku.ui.unblock();
            // Add initial tab
            Saiku.tabs.render();
            if(!Settings.ACTION) {
                Saiku.tabs.add(new Workspace());
            }
            // Notify the rest of the application that login was successful
            Saiku.events.trigger('session:new', {
                session: this
            });
        } else {
            if(!Settings.ACTION) {
                Saiku.tabs.add(new Workspace());
            }

        }
        var self = this;
/*MG TODO       
        $.get(encodeURI(Settings.REST_URL) + '/discover/templates', function(templates) {
            self.prpt_templates = templates;
        });
        $.get(encodeURI(Settings.REST_URL) + '/discover/pageformats', function(formats) {
            self.page_formats = formats;
        });
*/
    },
    prefetch_dimensions: function() {

        if(!this.mdModels) {
            Log.log(JSON.stringify({
                Message: "categories not initialized",
                Session: JSON.stringify(this)
            }));
            return;
        }

        for(var i = 0; i < this.mdModelInfos.length; i++) {
            var mdModelInfo = this.mdModelInfos[i];

            //var key = encodeURIComponent(mdModelInfo.domainId)  + "/" + mdModelInfo.modelId;
            var key = mdModelInfo.domainId + "/" + mdModelInfo.modelId;
            var path = key;
            //alert("puttin " + key);
            //var path = encodeURIComponent(mdModelInfo.domainId) + "/" + mdModelInfo.modelId;
            if(localStorage && localStorage.getItem("md_model." + key) !== null) {
                this.mdModels[key] = new MetadataModel(JSON.parse(localStorage.getItem("md_model." + key)));
            } else {
                this.mdModels[key] = new MetadataModel({
                    path: path,
                    key: key
                });
                this.mdModels[key].fetch();
            }
        }

        // Start routing
        if(Backbone.history) {
            Backbone.history.start();
        }

    },
    url: function() {
        var locale = (navigator.language || navigator.browserLanguage || navigator.systemLanguage || navigator.userLanguage).substring(0, 2).toLowerCase()
        return encodeURI(Settings.REPORTING_REST_MOUNT_POINT + "/discover/" + locale);
    }

});

SessionWorkspace = reportDesigner.SessionWorkspace;