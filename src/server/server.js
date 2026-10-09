import http from 'http';
import { handleApiRequest } from './apiRouter.js';

const PORT = process.env.PORT || 3001;

const server = http.createServer(async (req, res) => {
  const handled = await handleApiRequest(req, res);
  if (!handled) {
    res.statusCode = 404;
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`[BenefitTrack Backend] Server listening on http://localhost:${PORT}`);
});
