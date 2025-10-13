const request = require('supertest');
const app = require('../index'); // aha ni aho index.js ya backend iherereye

describe('Auth API', () => {
  beforeAll(async () => {
    // Wait for database initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  it('should signup new user', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      firstname: 'Test',
      lastname: 'User',
      phone: '3333333333',
      email: 'testuser4@example.com',
      username: 'testuser789',
      password: 'Test@1234',
      idNumber: '123456789',
      province: 'Kigali',
      district: 'Gasabo',
      sector: 'Remera',
      cell: 'Gisimenti',
      village: 'Kacyiru',
      referralId: null
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Signup successful/i);
  });
});
