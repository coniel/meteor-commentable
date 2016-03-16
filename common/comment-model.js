/**
 * A model for a comment which can be linked to many other database objects
 * @class Comment
 */
Comment = BaseModel.extendAndSetupCollection("comments", {softRemovable: true, userId: true});
LinkableModel.makeLinkable(Comment);
LikeableModel.makeLikeable(Comment, "comment");
CommentableModel.makeCommentable(Comment, "comment");

/**
 * The user that made the comment
 * @returns {User} A User instance representing the commenting user.
 */
Comment.prototype.user = function () {
    return Meteor.users.findOne(this.userId);
};

//create the schema
Comment.appendSchema({
    "body": {
        type: String,
        max: 2000
    }
});

Comment.appendSchema(LinkableModel.LinkableSchema);

Comment.meteorMethods({
    insert: new ValidatedMethod({
        name: 'comments.insert',
        mixins: [CallPromiseMixin, LoggedInMixin],
        validate: new SimpleSchema({
            doc: {
                type: Object
            },
            'doc.body': Comment.getSchemaKey('body'),
            'doc.linkedObjectId': Comment.getSchemaKey('linkedObjectId'),
            'doc.linkedObjectType': Comment.getSchemaKey('linkedObjectType')
        }).validator(),
        checkLoggedInError: {
            error: 'notLogged',
            message: 'You need to be logged in to call this method',//Optional
            reason: 'You need to login' //Optional
        },
        run: function ({doc}) {
            // Set userId of to current user
            doc.userId = this.userId;
            var comment = new Comment(doc);
            // Get the parent object
            var parent = comment.linkedObject();

            if (!parent) {
                throw new Meteor.Error("noLinkedObject");
            }

            // object type and id to validate against
            var checkOnType = comment.linkedObjectType;
            var checkOnId = parent._id;

            if (parent.linkedObjectType && parent.linkedObjectId) {
                // Add the linked objects parent as a grandparent
                doc.parentLinkedObjectType = parent.linkedObjectType;
                doc.parentLinkedObjectId = parent.linkedObjectId;

                if (!CommentableModel.options[checkOnType] || (CommentableModel.options[checkOnType] && !!CommentableModel.options[checkOnType].authorizeOnGrandParent)) {
                    // If the linked object has a prent, validate against the parent
                    checkOnType = parent.linkedObjectType;
                    checkOnId = parent.linkedObjectId;
                }
            }

            if (Can.createIn("comment", comment, checkOnType, checkOnId)) {
                Comment.collection.insert(doc, function (error, result) {
                    if (!error) {
                        //when a comment is added, update the comment count for the object being commented on
                        parent.getCollection().update({_id: comment.linkedObjectId}, {$set: {_lastActivity: new Date()}, $inc: {_commentCount: 1}});
                    } else {
                        console.log(error);
                    }
                });
            }
        }
    }),
    remove: new ValidatedMethod({
        name: 'comments.remove',
        mixins: [CallPromiseMixin, LoggedInMixin],
        validate: Comment.getSubSchema(["_id"], null, true),
        checkLoggedInError: {
            error: 'notLogged',
            message: 'You need to be logged in to call this method',//Optional
            reason: 'You need to login' //Optional
        },
        run: function ({_id}) {
            var comment = Comment.collection.findOne({_id: _id});

            var checkOnType = comment.parentLinkedObjectType || comment.linkedObjectType;
            var checkOnId = comment.parentLinkedObjectId || comment.linkedObjectId;

            if (Can.removeIn("comment", comment, checkOnType, checkOnId)) {
                Comment.collection.remove(_id, function (error, result) {
                    if (!error) {
                        //when a comment is deleted, update the comment count for the object being commented on
                        var collection = LinkableModel.getCollectionForRegisteredType(comment.linkedObjectType);
                        if (collection) {
                            collection.update(comment.linkedObjectId, {$inc: {_commentCount: -1}});
                        }

                        //if there are any likes or comments for the deleted comment, delete them
                        Comment.collection.remove({linkedObjectId: comment._id});
                        Like.collection.remove({linkedObjectId: comment._id});
                    }
                });
            }
        }
    })
});