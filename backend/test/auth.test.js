const request = require('supertest');
const app = require('../index'); // aha ni aho index.js ya backend iherereye

describe('Auth API', () => {
  it('should signup new user', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      firstname: 'Test',
      lastname: 'User',
      phone: '123456789',
      email: 'test@example.com',
      username: 'testuser',
      password: 'Test@1234',
      idNumber: '123456789',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Signup successful/i);
  });
});
