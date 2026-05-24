import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/prisma';
import {
  cleanupTestData,
  createTestAdmin,
  createTestCustomer,
  createTestStaff,
  loginAndGetToken,
} from '../helpers';

describe('👤 Customer Profile Integration Tests', () => {
  let adminToken: string;
  let staffToken: string;
  let customerToken: string;
  let customerAccount: any;

  beforeAll(async () => {
    // Make sure we have a clean DB at the start
    await cleanupTestData();

    // Create test accounts
    await createTestAdmin('admin_profile_test', 'password123');
    await createTestStaff('staff_profile_test', 'password123');
    customerAccount = await createTestCustomer('cust_profile_test', 'password123');

    // Login and get tokens
    adminToken = await loginAndGetToken(app, 'admin_profile_test', 'password123');
    staffToken = await loginAndGetToken(app, 'staff_profile_test', 'password123');
    customerToken = await loginAndGetToken(app, 'cust_profile_test', 'password123');
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('GET /api/v1/tai-khoan/thong-tin', () => {
    it('1. CUSTOMER can view own profile', async () => {
      const res = await request(app)
        .get('/api/v1/tai-khoan/thong-tin')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.MaTaiKhoan).toBe(customerAccount.MaTaiKhoan);
      expect(res.body.data.TenDangNhap).toBe('cust_profile_test');
      expect(res.body.data.HoTen).toBe('Test Customer');
      expect(res.body.data.Email).toBe('cust_profile_test@test.com');
      expect(res.body.data.SoDienThoai).toBe('0999000333');
      expect(res.body.data.VaiTro).toBe('CUSTOMER');
      expect(res.body.data.MaKhachHang).toBeDefined();
    });

    it('2. Profile response does not include MatKhau or RefreshTokens', async () => {
      const res = await request(app)
        .get('/api/v1/tai-khoan/thong-tin')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.MatKhau).toBeUndefined();
      expect(res.body.data.MatKhau).toBeUndefined();
      expect(res.body.data.RefreshTokens).toBeUndefined();
      expect(res.body.data.refreshTokens).toBeUndefined();
    });

    it('3. STAFF/ADMIN/Guest cannot access customer profile routes', async () => {
      // Guest
      const resGuest = await request(app).get('/api/v1/tai-khoan/thong-tin');
      expect(resGuest.status).toBe(401);

      // Staff
      const resStaff = await request(app)
        .get('/api/v1/tai-khoan/thong-tin')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(resStaff.status).toBe(403);

      // Admin
      const resAdmin = await request(app)
        .get('/api/v1/tai-khoan/thong-tin')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resAdmin.status).toBe(403);
    });

    it('4. Cannot view profile if account is disabled (KhaDung = false)', async () => {
      // Temporarily disable the customer account
      await prisma.taiKhoan.update({
        where: { MaTaiKhoan: customerAccount.MaTaiKhoan },
        data: { KhaDung: false },
      });

      const res = await request(app)
        .get('/api/v1/tai-khoan/thong-tin')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('vô hiệu hóa');

      // Re-enable the customer account
      await prisma.taiKhoan.update({
        where: { MaTaiKhoan: customerAccount.MaTaiKhoan },
        data: { KhaDung: true },
      });
    });
  });
});
