import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve(process.cwd(), 'postman');
fs.mkdirSync(outDir, { recursive: true });

const nowIso = new Date().toISOString();

const statusTest = (codes) => [
  `pm.test("Status code is ${codes.join('/')}", function () {`,
  `  pm.expect([${codes.join(', ')}]).to.include(pm.response.code);`,
  '});',
];

function request({ name, method, route, body, tests = [], prerequest = [], noAuth = false }) {
  const item = {
    name,
    request: {
      method,
      header: [],
      url: `{{baseUrl}}${route}`,
    },
    response: [],
  };

  if (body !== undefined) {
    item.request.header.push({
      key: 'Content-Type',
      value: 'application/json',
      type: 'text',
    });
    item.request.body = {
      mode: 'raw',
      raw: JSON.stringify(body, null, 2),
    };
  }

  if (noAuth) {
    item.request.auth = { type: 'noauth' };
  }

  const events = [];
  if (prerequest.length > 0) {
    events.push({
      listen: 'prerequest',
      script: { type: 'text/javascript', exec: prerequest },
    });
  }
  if (tests.length > 0) {
    events.push({
      listen: 'test',
      script: { type: 'text/javascript', exec: tests },
    });
  }
  if (events.length > 0) {
    item.event = events;
  }

  return item;
}

const collection = {
  info: {
    _postman_id: '47e97810-f0d5-4f54-8eb3-95853f36ce11',
    name: 'Mahalla Yettiligi Backend API (Auto Tests)',
    description:
      'Prerequisites:\n1) Backend running\n2) Redis running\n3) Seed applied: npm run prisma:seed\n\nRun folders in order for dependent IDs.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  auth: {
    type: 'bearer',
    bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }],
  },
  item: [
    {
      name: '01 Health',
      item: [
        request({
          name: 'GET Health',
          method: 'GET',
          route: '/api/v1/health',
          noAuth: true,
          tests: [
            ...statusTest([200]),
            'const responseJson = pm.response.json();',
            'pm.test("Health status is ok", function () { pm.expect(responseJson.status).to.eql("ok"); });',
          ],
        }),
        request({
          name: 'GET Readiness',
          method: 'GET',
          route: '/api/v1/health/readiness',
          noAuth: true,
          tests: [
            ...statusTest([200]),
            'const responseJson = pm.response.json();',
            'pm.test("Readiness payload exists", function () {',
            '  pm.expect(responseJson.checks).to.be.an("object");',
            '});',
          ],
        }),
      ],
    },
    {
      name: '02 Auth',
      item: [
        request({
          name: 'POST Auth OTP Request',
          method: 'POST',
          route: '/api/v1/auth/otp/request',
          noAuth: true,
          body: {
            phone: '{{adminPhone}}',
          },
          tests: [
            ...statusTest([200, 201]),
            'let responseJson = {}; try { responseJson = pm.response.json(); } catch (e) {}',
            'if (responseJson.otpCode) { pm.environment.set("otpCode", responseJson.otpCode); }',
            'pm.test("OTP request responded", function () { pm.expect(responseJson.message).to.be.a("string"); });',
          ],
        }),
        request({
          name: 'POST Auth OTP Verify',
          method: 'POST',
          route: '/api/v1/auth/otp/verify',
          noAuth: true,
          body: {
            phone: '{{adminPhone}}',
            code: '{{otpCode}}',
          },
          tests: [
            ...statusTest([200, 201]),
            'const responseJson = pm.response.json();',
            'if (responseJson.requiresTwoFactor) {',
            '  pm.environment.set("pendingTwoFactorToken", responseJson.pendingTwoFactorToken);',
            '  if (responseJson.twoFactorCode) {',
            '    pm.environment.set("twoFactorCode", responseJson.twoFactorCode);',
            '  }',
            '} else {',
            '  pm.environment.set("accessToken", responseJson.accessToken);',
            '  pm.environment.set("refreshToken", responseJson.refreshToken);',
            '  pm.environment.set("adminUserId", responseJson.user.id);',
            '}',
            'pm.test("Auth stage 1 response is valid", function () {',
            '  if (responseJson.requiresTwoFactor) {',
            '    pm.expect(responseJson.pendingTwoFactorToken).to.be.a("string");',
            '  } else {',
            '    pm.expect(responseJson.accessToken).to.be.a("string");',
            '    pm.expect(responseJson.refreshToken).to.be.a("string");',
            '  }',
            '});',
          ],
        }),
        request({
          name: 'POST Auth 2FA Verify',
          method: 'POST',
          route: '/api/v1/auth/2fa/verify',
          noAuth: true,
          body: {
            pendingTwoFactorToken: '{{pendingTwoFactorToken}}',
            code: '{{twoFactorCode}}',
          },
          tests: [
            ...statusTest([200, 201]),
            'const responseJson = pm.response.json();',
            'pm.environment.set("accessToken", responseJson.accessToken);',
            'pm.environment.set("refreshToken", responseJson.refreshToken);',
            'pm.environment.set("adminUserId", responseJson.user.id);',
            'pm.test("2FA tokens received", function () {',
            '  pm.expect(responseJson.accessToken).to.be.a("string");',
            '  pm.expect(responseJson.refreshToken).to.be.a("string");',
            '});',
          ],
        }),
        request({
          name: 'POST Auth Refresh',
          method: 'POST',
          route: '/api/v1/auth/refresh',
          noAuth: true,
          body: {
            refreshToken: '{{refreshToken}}',
          },
          tests: [
            ...statusTest([200, 201]),
            'const responseJson = pm.response.json();',
            'pm.environment.set("accessToken", responseJson.accessToken);',
            'pm.environment.set("refreshToken", responseJson.refreshToken);',
          ],
        }),
        request({
          name: 'POST Auth Logout',
          method: 'POST',
          route: '/api/v1/auth/logout',
          body: {
            refreshToken: '{{refreshToken}}',
          },
          tests: [...statusTest([200, 201])],
        }),
      ],
    },
    {
      name: '03 Mahallas',
      item: [
        request({
          name: 'POST Create Mahalla',
          method: 'POST',
          route: '/api/v1/mahallas',
          prerequest: [
            'const suffix = Date.now().toString().slice(-6);',
            'pm.environment.set("mahallaName", `Obod Mahalla ${suffix}`);',
            'pm.environment.set("districtName", `Yunusobod ${suffix}`);',
            'pm.environment.set("regionName", "Toshkent Shahri");',
          ],
          body: {
            regionName: '{{regionName}}',
            districtName: '{{districtName}}',
            name: '{{mahallaName}}',
          },
          tests: [
            ...statusTest([200, 201]),
            'const responseJson = pm.response.json();',
            'pm.environment.set("mahallaId", responseJson.id);',
            'pm.test("Mahalla ID saved", function () { pm.expect(responseJson.id).to.be.a("string"); });',
          ],
        }),
        request({
          name: 'GET Mahalla By ID',
          method: 'GET',
          route: '/api/v1/mahallas/{{mahallaId}}',
          tests: [
            ...statusTest([200]),
            'const responseJson = pm.response.json();',
            'pm.test("Mahalla fetched", function () { pm.expect(responseJson.id).to.eql(pm.environment.get("mahallaId")); });',
          ],
        }),
      ],
    },
    {
      name: '04 Users',
      item: [
        request({
          name: 'POST Create Staff User',
          method: 'POST',
          route: '/api/v1/users',
          prerequest: [
            'const suffix = (Math.floor(Math.random() * 9000000) + 1000000).toString();',
            'pm.environment.set("staffPhone", `+99890${suffix}`);',
          ],
          body: {
            phone: '{{staffPhone}}',
            fullName: 'Generated Staff User',
            role: 'STAFF',
            mahallaId: '{{mahallaId}}',
            staffPosition: 'CHAIRPERSON',
          },
          tests: [
            ...statusTest([200, 201]),
            'const responseJson = pm.response.json();',
            'pm.environment.set("staffUserId", responseJson.id);',
          ],
        }),
        request({
          name: 'POST Create Resident User',
          method: 'POST',
          route: '/api/v1/users',
          prerequest: [
            'const suffix = (Math.floor(Math.random() * 9000000) + 1000000).toString();',
            'pm.environment.set("residentPhone", `+99891${suffix}`);',
          ],
          body: {
            phone: '{{residentPhone}}',
            fullName: 'Generated Resident User',
            role: 'RESIDENT',
            mahallaId: '{{mahallaId}}',
          },
          tests: [
            ...statusTest([200, 201]),
            'const responseJson = pm.response.json();',
            'pm.environment.set("residentUserId", responseJson.id);',
          ],
        }),
        request({
          name: 'GET Staff User By ID',
          method: 'GET',
          route: '/api/v1/users/{{staffUserId}}',
          tests: [...statusTest([200])],
        }),
      ],
    },
    {
      name: '05 Media',
      item: [
        request({
          name: 'POST Upload Media',
          method: 'POST',
          route: '/api/v1/media',
          body: {
            filename: 'test-note.txt',
            mimeType: 'text/plain',
            contentBase64: 'SGVsbG8sIE1haGFsbGEgWWV0dGlsaWdpIQ==',
          },
          tests: [
            ...statusTest([200, 201]),
            'const responseJson = pm.response.json();',
            'pm.environment.set("mediaId", responseJson.id);',
          ],
        }),
        request({
          name: 'GET Media By ID',
          method: 'GET',
          route: '/api/v1/media/{{mediaId}}',
          tests: [...statusTest([200])],
        }),
        request({
          name: 'GET Media Download',
          method: 'GET',
          route: '/api/v1/media/{{mediaId}}/download',
          tests: [...statusTest([200])],
        }),
      ],
    },
    {
      name: '06 Posts',
      item: [
        request({
          name: 'POST Create Post',
          method: 'POST',
          route: '/api/v1/posts',
          body: {
            title: 'Postman test post',
            content: 'Testing post creation via Postman',
            mahallaId: '{{mahallaId}}',
            mediaIds: ['{{mediaId}}'],
          },
          tests: [
            ...statusTest([200, 201]),
            'const responseJson = pm.response.json();',
            'pm.environment.set("postId", responseJson.id);',
          ],
        }),
        request({
          name: 'GET Posts List',
          method: 'GET',
          route: '/api/v1/posts?mahallaId={{mahallaId}}',
          tests: [...statusTest([200])],
        }),
        request({
          name: 'PATCH Publish Post',
          method: 'PATCH',
          route: '/api/v1/posts/{{postId}}/publish',
          tests: [...statusTest([200])],
        }),
        request({
          name: 'PATCH Archive Post',
          method: 'PATCH',
          route: '/api/v1/posts/{{postId}}/archive',
          tests: [...statusTest([200])],
        }),
      ],
    },
    {
      name: '07 Complaints',
      item: [
        request({
          name: 'POST Create Complaint',
          method: 'POST',
          route: '/api/v1/complaints',
          body: {
            category: 'Infrastructure',
            description: 'Road damage test complaint',
            mahallaId: '{{mahallaId}}',
            latitude: '41.311081',
            longitude: '69.240562',
            mediaIds: ['{{mediaId}}'],
          },
          tests: [
            ...statusTest([200, 201]),
            'const responseJson = pm.response.json();',
            'pm.environment.set("complaintId", responseJson.id);',
          ],
        }),
        request({
          name: 'GET Complaints List',
          method: 'GET',
          route: '/api/v1/complaints?mahallaId={{mahallaId}}',
          tests: [...statusTest([200])],
        }),
        request({
          name: 'PATCH Complaint Status',
          method: 'PATCH',
          route: '/api/v1/complaints/{{complaintId}}/status',
          body: {
            status: 'IN_PROGRESS',
          },
          tests: [...statusTest([200])],
        }),
        request({
          name: 'POST Complaint Respond',
          method: 'POST',
          route: '/api/v1/complaints/{{complaintId}}/respond',
          body: {
            responseText: 'Issue accepted and assigned for processing.',
          },
          tests: [...statusTest([200, 201])],
        }),
      ],
    },
    {
      name: '08 Monthly Reports & Ratings',
      item: [
        request({
          name: 'POST Create Monthly Report',
          method: 'POST',
          route: '/api/v1/monthly-reports',
          prerequest: [
            'const now = new Date();',
            'const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;',
            'pm.environment.set("reportMonth", month);',
            'pm.environment.set("workDateIso", now.toISOString());',
          ],
          body: {
            mahallaId: '{{mahallaId}}',
            month: '{{reportMonth}}',
            summary: 'Postman generated monthly summary',
            status: 'SUBMITTED',
            items: [
              {
                workName: 'Cleanup campaign',
                workDate: '{{workDateIso}}',
                resultText: 'Neighborhood cleanup completed.',
                evidenceMediaIds: ['{{mediaId}}'],
              },
            ],
          },
          tests: [
            ...statusTest([200, 201]),
            'const responseJson = pm.response.json();',
            'pm.environment.set("reportId", responseJson.id);',
          ],
        }),
        request({
          name: 'GET Monthly Reports',
          method: 'GET',
          route: '/api/v1/monthly-reports?mahallaId={{mahallaId}}',
          tests: [...statusTest([200])],
        }),
        request({
          name: 'POST Create Rating',
          method: 'POST',
          route: '/api/v1/ratings',
          body: {
            reportId: '{{reportId}}',
            score: 5,
            verdict: 'TRUTH',
            comment: 'Good monthly performance',
          },
          tests: [
            ...statusTest([200, 201]),
            'const responseJson = pm.response.json();',
            'if (responseJson.id) { pm.environment.set("ratingId", responseJson.id); }',
          ],
        }),
      ],
    },
    {
      name: '09 Events',
      item: [
        request({
          name: 'POST Create Event',
          method: 'POST',
          route: '/api/v1/events',
          body: {
            title: 'Postman Event',
            scheduledAt: '{{$isoTimestamp}}',
            locationName: 'Mahalla center',
            latitude: '41.311081',
            longitude: '69.240562',
            mahallaId: '{{mahallaId}}',
            responsibleUserId: '{{staffUserId}}',
            participantCount: 25,
          },
          tests: [
            ...statusTest([200, 201]),
            'const responseJson = pm.response.json();',
            'pm.environment.set("eventId", responseJson.id);',
          ],
        }),
        request({
          name: 'GET Events',
          method: 'GET',
          route: '/api/v1/events?mahallaId={{mahallaId}}',
          tests: [...statusTest([200])],
        }),
        request({
          name: 'PATCH Event Status',
          method: 'PATCH',
          route: '/api/v1/events/{{eventId}}/status',
          body: {
            status: 'COMPLETED',
          },
          tests: [...statusTest([200])],
        }),
      ],
    },
    {
      name: '10 Work Tracking',
      item: [
        request({
          name: 'POST Check-In',
          method: 'POST',
          route: '/api/v1/work-tracking/check-in',
          body: {
            mahallaId: '{{mahallaId}}',
            latitude: '41.311081',
            longitude: '69.240562',
          },
          tests: [
            ...statusTest([200, 201]),
            'const responseJson = pm.response.json();',
            'pm.environment.set("sessionId", responseJson.id);',
          ],
        }),
        request({
          name: 'POST Add Location Log',
          method: 'POST',
          route: '/api/v1/work-tracking/location-logs',
          body: {
            sessionId: '{{sessionId}}',
            latitude: '41.312000',
            longitude: '69.241000',
            recordedAt: '{{$isoTimestamp}}',
          },
          tests: [...statusTest([200, 201])],
        }),
        request({
          name: 'GET Daily Stats',
          method: 'GET',
          route: '/api/v1/work-tracking/daily-stats',
          tests: [...statusTest([200])],
        }),
        request({
          name: 'POST Check-Out',
          method: 'POST',
          route: '/api/v1/work-tracking/check-out',
          body: {
            sessionId: '{{sessionId}}',
            latitude: '41.311500',
            longitude: '69.240900',
          },
          tests: [...statusTest([200, 201])],
        }),
      ],
    },
    {
      name: '11 Dashboard & Audit',
      item: [
        request({
          name: 'GET Dashboard Summary',
          method: 'GET',
          route: '/api/v1/dashboard/summary?mahallaId={{mahallaId}}',
          tests: [...statusTest([200])],
        }),
        request({
          name: 'GET Dashboard Charts',
          method: 'GET',
          route: '/api/v1/dashboard/charts?mahallaId={{mahallaId}}&months=6',
          tests: [...statusTest([200])],
        }),
        request({
          name: 'GET Audit Logs',
          method: 'GET',
          route: '/api/v1/audit-logs?page=1&pageSize=20',
          tests: [...statusTest([200])],
        }),
      ],
    },
    {
      name: '12 Integrations (Mock)',
      item: [
        request({
          name: 'POST SMS Send',
          method: 'POST',
          route: '/api/v1/integrations/sms/send',
          body: {
            phone: '{{staffPhone}}',
            message: 'Integration smoke test',
          },
          tests: [...statusTest([200, 201])],
        }),
        request({
          name: 'POST OneID Verify',
          method: 'POST',
          route: '/api/v1/integrations/oneid/verify',
          body: {
            token: 'oneid-token-1234567890',
          },
          tests: [...statusTest([200, 201])],
        }),
        request({
          name: 'POST Geo Reverse Geocode',
          method: 'POST',
          route: '/api/v1/integrations/geo/reverse-geocode',
          body: {
            latitude: '41.311081',
            longitude: '69.240562',
          },
          tests: [...statusTest([200, 201])],
        }),
        request({
          name: 'POST E-Sign Request',
          method: 'POST',
          route: '/api/v1/integrations/e-sign/sign',
          body: {
            content: 'This is sample content for e-sign integration stub.',
          },
          tests: [...statusTest([200, 201])],
        }),
        request({
          name: 'POST ERP Complaint Push',
          method: 'POST',
          route: '/api/v1/integrations/erp/complaints/push',
          body: {
            complaintId: '{{complaintId}}',
          },
          tests: [...statusTest([200, 201])],
        }),
      ],
    },
  ],
};

const environment = {
  id: 'cffbd355-e7c5-44fa-b22a-1e7f6a27f16b',
  name: 'Mahalla Yettiligi Local',
  values: [
    { key: 'baseUrl', value: 'http://localhost:4000', enabled: true },
    { key: 'adminPhone', value: '+998900000001', enabled: true },
    { key: 'otpCode', value: '', enabled: true },
    { key: 'pendingTwoFactorToken', value: '', enabled: true },
    { key: 'twoFactorCode', value: '', enabled: true },
    { key: 'accessToken', value: '', enabled: true },
    { key: 'refreshToken', value: '', enabled: true },
    { key: 'adminUserId', value: '', enabled: true },
    { key: 'mahallaId', value: '', enabled: true },
    { key: 'regionName', value: 'Toshkent Shahri', enabled: true },
    { key: 'districtName', value: '', enabled: true },
    { key: 'mahallaName', value: '', enabled: true },
    { key: 'staffPhone', value: '', enabled: true },
    { key: 'staffUserId', value: '', enabled: true },
    { key: 'residentPhone', value: '', enabled: true },
    { key: 'residentUserId', value: '', enabled: true },
    { key: 'mediaId', value: '', enabled: true },
    { key: 'postId', value: '', enabled: true },
    { key: 'complaintId', value: '', enabled: true },
    { key: 'reportMonth', value: '', enabled: true },
    { key: 'workDateIso', value: '', enabled: true },
    { key: 'reportId', value: '', enabled: true },
    { key: 'eventId', value: '', enabled: true },
    { key: 'sessionId', value: '', enabled: true },
  ],
  _postman_variable_scope: 'environment',
  _postman_exported_at: nowIso,
  _postman_exported_using: 'Codex GPT-5',
};

fs.writeFileSync(
  path.join(outDir, 'mahalla-yettiligi.postman_collection.json'),
  `${JSON.stringify(collection, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(outDir, 'mahalla-yettiligi-local.postman_environment.json'),
  `${JSON.stringify(environment, null, 2)}\n`,
);

console.log('Postman assets generated in ./postman');



