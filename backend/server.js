'use strict'

require('./config')

const db = require("./api/postgres/models")
const http = require('http')
const express = require('express')
const morgan = require('morgan')
const cors = require('cors');
const { Server } = require("socket.io");

const middleware = require('./middleware')

// routers
const zoomAppRouter = require('./api/zoomapp/router')
const zoomRouter = require('./api/zoom/router')
const thirdPartyOAuthRouter = require('./api/thirdpartyauth/router')
const postgresRouter = require('./api/postgres/router')
const { env } = require('process')

// handlers

// Create app
const app = express()

// Set view engine (for system browser error pages)
app.set('view engine', 'pug')

// Set static file directory (for system browser error pages)
app.use('/', express.static('public'))

// Set universal middleware
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(middleware.session)
app.use(middleware.setResponseHeaders)
app.use(cors());

// Zoom App routes
app.use('/api/zoomapp', zoomAppRouter)
if (
  process.env.AUTH0_CLIENT_ID &&
  process.env.AUTH0_CLIENT_SECRET &&
  process.env.AUTH0_ISSUER_BASE_URL
) {
  app.use('/api/auth0', thirdPartyOAuthRouter)
} else {
  console.log('Please add Auth0 env variables to enable the /auth0 route')
}

app.use('/zoom', zoomRouter)

// Postgres route
app.use('/api/postgres', postgresRouter)

app.get('/hello', (req, res) => {
  res.send('THEK1NG0FGAM3S')
})

// Handle 404
app.use((req, res, next) => {
  const error = new Error('Not found')
  error.status = 404
  next(error)
})

// Handle errors (system browser only)
app.use((error, req, res) => {
  res.status(error.status || 500)
  res.render('error', {
    title: 'Error',
    message: error.message,
    stack: error.stack,
  })
})

// Start express server
const server = http.createServer(app).listen(process.env.PORT, () => {
  console.log('Zoom App is listening on port', process.env.PORT)
});

// initialize socket.io
const io = new Server(server);

const studentHandlers = require("./api/postgres/handers/studentHander");
const professorHanders = require("./api/postgres/handers/professorHandler");

io.on('connection', (socket) => {
  console.log(`SOCKET RESPONSE: user connected ${socket.id}`);
  // event listeners
  socket.on('join_lecture', (data) => {
    const { name, code } = data;
    console.log(`${name} has joined lecture ${code}`);
    socket.join(code);
    currentLecture = code;
  });

  // register handers
  studentHandlers(io, socket);
  professorHanders(io, socket);
});

// Create connection to db
// ! {force: true} for development purposes only
db.sequelize.sync({ force: true }).then(async () => {
  console.log("Sync'd successfully.");
}).catch((error) => {
  console.error("Unable to sync : ", error);
});
