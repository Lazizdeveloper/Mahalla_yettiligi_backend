import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const baseUrl = __ENV.BASE_URL || 'http://localhost:4000';

export default function () {
  const healthRes = http.get(`${baseUrl}/api/v1/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  });

  const readinessRes = http.get(`${baseUrl}/api/v1/health/readiness`);
  check(readinessRes, {
    'readiness status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
