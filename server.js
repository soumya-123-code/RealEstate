const next = require('next');
const http = require('http');
const port = parseInt(process.env.PORT, 10) || 3000;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    try {
      return handle(req, res);
    } catch (err) {
      console.error('Request handler error:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  server.listen(port, () => {
    console.log('Next server listening on port', port);
  });
}).catch(err => {
  console.error('Failed to prepare Next app:', err);
  process.exit(1);
});
