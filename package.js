Package.describe({
    name: "coniel:commentable",
    summary: "A package for implementing social commenting",
    version: "0.0.1",
    git: "https://github.com/coniel/commentable.git"
});

Package.onUse(function(api) {
    api.versionsFrom("1.2");

    api.use([
        "coniel:base-model@0.3.0",
        "coniel:likeable@0.0.1",
        "coniel:can@0.1.0",
        "mdg:validated-method@1.0.1",
        "didericis:callpromise-mixin@0.0.1",
        "tunifight:loggedin-mixin@0.1.0",
        "ecmascript",
        "es5-shim"
    ]);

    api.imply("coniel:likeable");

    api.addFiles("common/commentable-model.js");
    api.addFiles("common/comment-model.js");

    api.export(["CommentableModel", "Comment"]);
});
