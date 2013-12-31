/*
 * Copyright 2013 Jive Software
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

/**
 * Library for manipulating external stream instances.
 * @extends module:abstractInstances
 * @module extstreamsInstances
 */

///////////////////////////////////////////////////////////////////////////////////
// private

var q = require('q');
var util = require('util');
var jive = require('../../api');
var instances = require('./instances');
var pusher = require('./dataPusher');

var extstreams = Object.create(instances);

///////////////////////////////////////////////////////////////////////////////////
// public

module.exports = extstreams;

extstreams.getCollection = function() {
    return "extstreamInstance";
};

/**
 * @memberof module:extstreamsInstances
 * @param {Object} tileInstance
 * @param {Object} activity
 * @returns {Promise} Promise
 */
extstreams.pushActivity = function ( tileInstance, activity) {
    return jive.context.scheduler.schedule(jive.constants.tileEventNames.PUSH_ACTIVITY_TO_JIVE, {
        'tileInstance' : tileInstance,
        'activity' : activity
    } );
};

var pushComment = function ( tileInstance, comment, commentURL) {
    return jive.context.scheduler.schedule(jive.constants.tileEventNames.PUSH_COMMENT_TO_JIVE, {
        'tileInstance' : tileInstance,
        'commentURL' : commentURL,
        'comment' : comment
    } );
};

/**
 * Create a comment in Jive on an activity that was generated by an external stream.
 * @memberof module:extstreamsInstances
 * @param {Object} activity - activity object returned from jive. For example, an object returned in the promise by extstreams.pushActivity method
 * @param {Object} comment - comment JSON, see https://developers.jivesoftware.com/api/rest/CommentEntity.html
 * @returns {Promise} Promise that resolves with a response object. response.entity is the created comment that is returned from Jive
 */
extstreams.commentOnActivity = function(activity, comment ) {
    return jive.context.scheduler.schedule(jive.constants.tileEventNames.COMMENT_ON_ACTIVITY, {
        'activity' : activity,
        'comment' : comment
    } );
};

/**
 * Create a comment on an activity using this endpoint---
 * http://mycomany.jiveon.com/api/jivelinks/v1/extstreams/1234/extactivities/{externalActivityID}/comments
 * @memberof module:extstreamsInstances
 * @param {String} externalActivityID
 * @param {Object} extstream
 * @param {Object} comment
 * @returns {Promise} Promise
 */
extstreams.commentOnActivityByExternalID = function(extstream, externalActivityID, comment) {
    return jive.context.scheduler.schedule(jive.constants.tileEventNames.COMMENT_ON_ACTIVITY_BY_EXTERNAL_ID, {
        'extstream' : extstream,
        'externalActivityID' : externalActivityID,
        'comment' : comment
    } );
};

//Change default options here
var DEFAULT_OPTS = {
    commentSourceType: "ALL"
};

/**
 *
 * Options for the following methods look like:
 * var opts = {
 *      "fieldList": ["content", "parent", "resources" ], // list of fields to be returned on Jive entity
 *      "itemsPerPage": 100,              // for paginated requests, the no. of items to return per request
 *      "commentSourceType": "JIVE",     // Must be "JIVE" or "EXTERNAL" or "ALL". Defaults to "ALL"
 *      "publishedAfter": 1367968760257  // Get comments that were created after this time only
 * }
 */

/**
 * Get all the comments in Jive for a given activity object.
 * @memberof module:extstreamsInstances
 * @param {Object} activity - activity object
 * @param {Object} opts - JSON describing options for retrieving content from Jive. See above documentation.
 * @returns {Promise} Promise A promise that resolves to a response. response.entity is the list of comments. See  See https://developers.jivesoftware.com/api/rest/index.html#lists
 */
extstreams.fetchCommentsOnActivity = function(activity, opts) {
    return jive.context.scheduler.schedule(jive.constants.tileEventNames.FETCH_COMMENTS_ON_ACTIVITY, {
        'activity' : activity,
        'opts' : opts || DEFAULT_OPTS
    } );
};

/**
 * Get all comments in Jive for ALL activity of the given external stream
 * Note pagination (next) operations are always performed inline, never on a separate node
 * @memberof module:extstreamsInstances
 * @param {Object} extstream - an external stream object from the jive-sdk
 * @param {Object} opts - JSON describing options for retrieving content from Jive. See above documentation.
 * @returns {Promise} Promise A promise that resolves to a response. response.entity is the list of comments. See  See https://developers.jivesoftware.com/api/rest/index.html#lists
 */
extstreams.fetchAllCommentsForExtstream = function(extstream, opts) {
    return jive.context.scheduler.schedule(jive.constants.tileEventNames.FETCH_ALL_COMMENTS_FOR_EXT_STREAM, {
        'extstream' : extstream,
        'opts' : opts || DEFAULT_OPTS
    }).then( function(response) {
        var entity = response.entity;
        var instance = response.instance;
        entity.next = function() {
            return pusher.getPaginated(instance, entity.links.next);
        };

        return {
            'entity' : entity
        };
    });
};
