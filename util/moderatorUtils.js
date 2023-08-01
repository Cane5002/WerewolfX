exports.isModerator = function isModerator(req, res, next) {
    res.locals.isModerator = false;
    if (!res.locals.gameSettings) return next();
    if (res.locals.gameSettings.moderatorSid==req.sessionID) res.locals.isModerator = true;
    next();
};