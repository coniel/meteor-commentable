# Commentable #

Originally based on the [socialize:commentable](https://atmospherejs.com/socialize/commentable) package but modified to use (validated) Meteor methods rather than client side operations and [coniel:can](https://atmospherejs.com/coniel/can) for authorization.

A package enabling the creation of models that can be commented on. For example a photo in an photo album could have comments, but also a post to a users feed could as well. Rather than maintaining a photo comments collection and a post comments collection we can implement CommentableModel on our `Post` and `Photo` models and then use it's new methds `addcomment`, `comments`, and `commentCount`.

## CommentableModel ##

CommentableModel is used to add commenting capabilities to a model that is built on Socialize's `BaseModel` class. To make a model commentable just call `CommentableModel.makeCommentable(Model, "typeAsString")` passing in a model class and a string that will be used to tag the comment records for later retrieval.

```javascript
var Post = BaseModel.extendAndSetupCollection("posts");

CommentableModel.makeCommentable(Post, "post", options);
```

This will add the following methods to the prototype of the model.

**addComment(body)** - create a comment that is linked this instance of a model.

**comments(limit, skip, sortKey, sortOrder)** - returns a cursor of comments that are linked to this instance of a model.

**commentCount()** - returns the number of comments for this instance of a model.

```javascript
var post = Meteor.posts.findOne();

post.addComment("Post Comments are so cool, and easy to implement with the socialize:commentable package");

post.comments(null, null, "date", -1).forEach(function(comment){
    console.log(comment.user().username, ": ", comment.body);
});

post.commentCount(); //=> 0
```

## Comment  - Extends [LinkableModel](https://github.com/copleykj/socialize-linkable-model) - Implements [CommentableModel](https://github.com/copleykj/socialize-commentable), [LikeableModel](https://github.com/copleykj/socialize-likeable)##

A comment is a record of a user commenting on an instance of a model with a reference to that instance. The `Comment` model also implements `CommentableModel` and `LikeableModel` so that comments can be liked as well as commented on. If you choose to use the package in this fashion, be careful how far you allow the nesting of comments.

### Instance Methods ###

**user()** - Returns an instance of the user that made the comment,
