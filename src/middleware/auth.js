const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

const requireAdmin = (req, res, next) => {
    if (req.session.userId && req.session.isAdmin) {
        next();
    } else {
        res.status(403).json({ error: 'Acceso denegado' });
    }
};

const requireApiAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'No autorizado' });
    }
};

module.exports = {
    requireAuth,
    requireAdmin,
    requireApiAuth
};
