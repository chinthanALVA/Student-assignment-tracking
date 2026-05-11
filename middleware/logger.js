<<<<<<< HEAD
function logger(req, res, next) {
    const now = new Date().toISOString()
    console.log(`[${now}] ${req.method} ${req.url}`)
    next()   // pass control to the next middleware/route
}

=======
function logger(req, res, next) {
    const now = new Date().toISOString()
    console.log(`[${now}] ${req.method} ${req.url}`)
    next()   // pass control to the next middleware/route
}

>>>>>>> 234b833b543d03372ed74e2e53bf44d844c19be3
module.exports = logger