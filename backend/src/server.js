const http = require('http');
const app = require('./app');
const config = require('./config/env');
const { initSocket } = require('./socket');

const server = http.createServer(app);
initSocket(server);

server.listen(config.port, () => {
  console.log(`Inventra API running on http://localhost:${config.port}/api/v1`);
});
