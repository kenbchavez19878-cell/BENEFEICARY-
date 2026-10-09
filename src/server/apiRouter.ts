import type { IncomingMessage, ServerResponse } from 'http';
import {
  getWomenSoloParentCases,
  getAicsCases,
  getCaseById,
  updateCaseStep,
} from './controllers/caseController';

// Helper to parse query parameters from URL
function parseUrl(urlStr: string) {
  const [pathname, search] = (urlStr || '').split('?');
  const query: Record<string, string> = {};
  if (search) {
    const params = new URLSearchParams(search);
    params.forEach((val, key) => {
      query[key] = val;
    });
  }
  return { pathname, query };
}

// Helper to read and parse JSON body
function readJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

// Send JSON response
function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(data));
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const { pathname, query } = parseUrl(req.url || '');

  // Only handle routes under /api/
  if (!pathname.startsWith('/api/')) {
    return false;
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return true;
  }

  try {
    // 1. Health check
    if (pathname === '/api/health') {
      sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
      return true;
    }

    // 2. GET /api/cases/women-solo-parent
    if (req.method === 'GET' && pathname === '/api/cases/women-solo-parent') {
      const cases = await getWomenSoloParentCases(query);
      sendJson(res, 200, {
        success: true,
        module: 'women-solo-parent',
        count: cases.length,
        data: cases,
      });
      return true;
    }

    // 3. GET /api/cases/aics
    if (req.method === 'GET' && pathname === '/api/cases/aics') {
      const cases = await getAicsCases(query);
      sendJson(res, 200, {
        success: true,
        module: 'aics',
        count: cases.length,
        data: cases,
      });
      return true;
    }

    // 4. PATCH /api/cases/:id/step
    const patchStepMatch = pathname.match(/^\/api\/cases\/([^\/]+)\/step$/);
    if (req.method === 'PATCH' && patchStepMatch) {
      const idOrCaseNumber = decodeURIComponent(patchStepMatch[1]);
      const body = await readJsonBody(req);
      const updatedCase = await updateCaseStep(idOrCaseNumber, body);
      sendJson(res, 200, {
        success: true,
        message: 'Case step data updated successfully',
        data: updatedCase,
      });
      return true;
    }

    // 5. GET /api/cases/:id
    const getCaseMatch = pathname.match(/^\/api\/cases\/([^\/]+)$/);
    if (req.method === 'GET' && getCaseMatch) {
      const idOrCaseNumber = decodeURIComponent(getCaseMatch[1]);
      const result = await getCaseById(idOrCaseNumber, query.module);
      if (!result) {
        sendJson(res, 404, {
          success: false,
          error: `Case with ID/Case Number '${idOrCaseNumber}' not found`,
        });
        return true;
      }
      sendJson(res, 200, {
        success: true,
        module: result.module,
        data: result.caseData,
        audit_logs: result.auditLogs,
      });
      return true;
    }

    // Not found API route
    sendJson(res, 404, { success: false, error: `API route not found: ${pathname}` });
    return true;
  } catch (err: any) {
    console.error(`[API Error] ${req.method} ${pathname}:`, err);
    sendJson(res, 500, {
      success: false,
      error: err.message || 'Internal server error',
    });
    return true;
  }
}
