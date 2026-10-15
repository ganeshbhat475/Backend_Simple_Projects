const router = require('express').Router()

router.get('/', (req, res) => {
    res.send("<form action='/test/login' method='POST'><input type='text' name='username' placeholder='username'><input type='password' name='password' placeholder='password'><button type='submit'>Login</button></form>")
})


router.post('/login', (req, res) => {
    console.log(req.body.username, req.body.password)
    // res.send("Username:" + req.body.username + "Password:" + req.body.password)
    res.json({message:"Hello from the router"})
    // res.json(1234)
})

module.exports = router