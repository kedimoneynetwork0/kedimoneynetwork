const request = require('supertest');
const app = require('../index'); // aho server yawe iherereye

describe('Auth API', () => {
  beforeAll(async () => {
    // Wait for database initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  it('should signup new user', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      firstname: 'Test2',
      lastname: 'User2',
      phone: '2222222222',
      email: 'testuser3@example.com',
      username: 'testuser999',
      password: 'Test@1234',
      idNumber: '987654321',
      province: 'Kigali',
      district: 'Gasabo',
      sector: 'Remera',
      cell: 'Gisimenti',
      village: 'Kacyiru',
      referralId: null
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toMatch(/Signup successful/i);
  });
});
