CommentableModel = {
    options: {}
};

CommentableModel.makeCommentable = function (model, type, options) {
    if (model.appendSchema && type) {
        CommentableModel.options[type] = options;
        model.appendSchema(commentableSchema);
        LinkableModel.registerLinkableType(model, type);
        _.extend(model.prototype, commentableMethods);
    } else {
        throw new Meteor.Error("makeCommentableFailed", "Could not make model commentable. Please make sure you passed in a model and type");
    }
};


var commentableMethods = {
    /**
     * Create and link a comment
     * @param {String} body The body text of the comment
     */
    addComment: function (doc) {
        var type = this._objectType;
        new Comment({body: doc.body, linkedObjectId: this._id, linkedObjectType: type}).save();
    },
    /**
     * Get the comments for a model that is able to be commented on
     * @param   {Number}       limit     The maximum number of records to return
     * @param   {Number}       skip      The number of records to skip
     * @param   {String}       sortBy    The field on which to sort
     * @param   {Number}       sortOrder The order in which to sort. 1 for ascending and -1 for descending
     * @returns {Mongo.Cursor} A cursor that returns comment instances
     */
    comments: function (limit, skip, sortBy, sortOrder) {
        var options = {};

        if (limit) {
            options.limit = limit;
        }

        if (skip) {
            options.skip = skip;
        }

        if (sortBy && sortOrder) {
            options.sort = {};
            options.sort[sortBy] = sortOrder;
        }

        return Comment.collection.find({linkedObjectId: this._id}, options).fetch();
    },

    /**
     * The number of comments on the commentable object
     * @returns {Number} The number of comments
     */
    commentCount: function () {
        //Necessary  for backwards compatibility with old comments
        return this._commentCount || 0;
    }
};

//create a schema which can be attached to other commentable types
var commentableSchema = new SimpleSchema({
    "_commentCount": {
        type: Number,
        autoValue: function () {
            if (this.isInsert) {
                return 0;
            }
        }
    },
    "_lastActivity": {
        type: Date,
        autoValue: function () {
            if (this.isInsert) {
                return new Date();
            }
        }
    }
});
