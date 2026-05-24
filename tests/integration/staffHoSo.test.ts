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

describe('👤 Staff Profile Integration Tests', () => {
  let adminToken: string;
  let customerToken: string;
  let staffToken: string;
  let staffAccount: any;
  let secondStaffAccount: any;

  beforeAll(async () => {
    await cleanupTestData();

    // Create accounts
    await createTestAdmin('admin_staff_profile_test', 'password123');
    await createTestCustomer('cust_staff_profile_test', 'password123');
    staffAccount = await createTestStaff('staff_ho_so_test', 'password123');

    // Create a second staff for duplicate email/phone tests
    const bcrypt = require('bcrypt');
    const hashed = await bcrypt.hash('password123', 4);
    const randomPhone = '077' + Math.floor(1000000 + Math.random() * 9000000).toString();
    secondStaffAccount = await prisma.taiKhoan.create({
      data: {
        TenDangNhap: 'staff_ho_so_test2',
        MatKhau: hashed,
        HoTen: 'Second Staff',
        Email: 'staff_ho_so_test2@test.com',
        SoDienThoai: randomPhone,
        VaiTro: 'STAFF',
        KhaDung: true,
        NhanVien: { create: { ChucVu: 'Nhân viên', KhaDung: true } },
      },
    });

    // Tokens
    adminToken = await loginAndGetToken(app, 'admin_staff_profile_test', 'password123');
    customerToken = await loginAndGetToken(app, 'cust_staff_profile_test', 'password123');
    staffToken = await loginAndGetToken(app, 'staff_ho_so_test', 'password123');
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  // ================================================================
  // GET /api/v1/staff/ho-so
  // ================================================================
  describe('GET /api/v1/staff/ho-so', () => {
    it('1. STAFF can view own profile', async () => {
      const res = await request(app)
        .get('/api/v1/staff/ho-so')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.MaTaiKhoan).toBe(staffAccount.MaTaiKhoan);
      expect(res.body.data.TenDangNhap).toBe('staff_ho_so_test');
      expect(res.body.data.HoTen).toBe('Test Staff');
      expect(res.body.data.VaiTro).toBe('STAFF');
      expect(res.body.data.MaNhanVien).toBeDefined();
      expect(res.body.data.ChucVu).toBeDefined();
    });

    it('2. Profile response does not include MatKhau or RefreshTokens', async () => {
      const res = await request(app)
        .get('/api/v1/staff/ho-so')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.MatKhau).toBeUndefined();
      expect(res.body.data.RefreshTokens).toBeUndefined();
      expect(res.body.data.refreshTokens).toBeUndefined();
    });

    it('3. Guest (no token) is rejected with 401', async () => {
      const res = await request(app).get('/api/v1/staff/ho-so');
      expect(res.status).toBe(401);
    });

    it('4. CUSTOMER is rejected with 403', async () => {
      const res = await request(app)
        .get('/api/v1/staff/ho-so')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('5. ADMIN is rejected with 403', async () => {
      const res = await request(app)
        .get('/api/v1/staff/ho-so')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ================================================================
  // PUT /api/v1/staff/ho-so
  // ================================================================
  describe('PUT /api/v1/staff/ho-so', () => {
    it('1. STAFF can update HoTen, Email, SoDienThoai, GioiTinh, NgaySinh', async () => {
      const res = await request(app)
        .put('/api/v1/staff/ho-so')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          HoTen: 'Updated Staff Name',
          Email: 'staff_updated@test.com',
          SoDienThoai: '0911222333',
          GioiTinh: true,
          NgaySinh: '1992-06-15',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.HoTen).toBe('Updated Staff Name');
      expect(res.body.data.Email).toBe('staff_updated@test.com');
      expect(res.body.data.SoDienThoai).toBe('0911222333');
      expect(res.body.data.GioiTinh).toBe(true);
      expect(new Date(res.body.data.NgaySinh).toISOString().split('T')[0]).toBe('1992-06-15');
      expect(res.body.data.MatKhau).toBeUndefined();
    });

    it('2. Cannot update Email to another account\'s email', async () => {
      const res = await request(app)
        .put('/api/v1/staff/ho-so')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ Email: 'staff_ho_so_test2@test.com' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Email đã được sử dụng');
    });

    it('3. Cannot update SoDienThoai to another account\'s phone', async () => {
      const res = await request(app)
        .put('/api/v1/staff/ho-so')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ SoDienThoai: secondStaffAccount.SoDienThoai });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Số điện thoại đã được sử dụng');
    });

    it('4. Empty update body is rejected with 422', async () => {
      const res = await request(app)
        .put('/api/v1/staff/ho-so')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({});

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('5. Cannot update restricted fields', async () => {
      const restrictedFields = [
        { TenDangNhap: 'new_username' },
        { MatKhau: 'new_hashed_pass' },
        { VaiTro: 'ADMIN' },
        { KhaDung: false },
        { MaTaiKhoan: 'some-other-uuid' },
        { MaNhanVien: 'some-other-uuid' },
        { ChucVu: 'Quản lý' },
        { NgayTao: new Date().toISOString() },
        { NgayCapNhat: new Date().toISOString() },
      ];

      for (const field of restrictedFields) {
        const res = await request(app)
          .put('/api/v1/staff/ho-so')
          .set('Authorization', `Bearer ${staffToken}`)
          .send(field);

        expect(res.status).toBe(422);
        expect(res.body.success).toBe(false);
        expect(res.body.errors.restricted_fields).toContain(
          'Không được phép cập nhật các trường hạn chế',
        );
      }
    });

    it('6. Guest (no token) is rejected with 401', async () => {
      const res = await request(app)
        .put('/api/v1/staff/ho-so')
        .send({ HoTen: 'Should Fail' });
      expect(res.status).toBe(401);
    });

    it('7. CUSTOMER is rejected with 403', async () => {
      const res = await request(app)
        .put('/api/v1/staff/ho-so')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ HoTen: 'Should Fail' });
      expect(res.status).toBe(403);
    });

    it('8. ADMIN is rejected with 403', async () => {
      const res = await request(app)
        .put('/api/v1/staff/ho-so')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ HoTen: 'Should Fail' });
      expect(res.status).toBe(403);
    });
  });

  // ================================================================
  // PUT /api/v1/staff/doi-mat-khau
  // ================================================================
  describe('PUT /api/v1/staff/doi-mat-khau', () => {
    it('1. Fails with wrong old password', async () => {
      const res = await request(app)
        .put('/api/v1/staff/doi-mat-khau')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          MatKhauCu: 'wrongpassword',
          MatKhauMoi: 'newpassword456',
          XacNhanMatKhauMoi: 'newpassword456',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Mật khẩu cũ không chính xác');
    });

    it('2. Fails if confirmation does not match', async () => {
      const res = await request(app)
        .put('/api/v1/staff/doi-mat-khau')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          MatKhauCu: 'password123',
          MatKhauMoi: 'newpassword456',
          XacNhanMatKhauMoi: 'differentconfirm',
        });

      expect(res.status).toBe(422);
      expect(res.body.errors.XacNhanMatKhauMoi[0]).toContain('không khớp');
    });

    it('3. Fails if new password is the same as old password', async () => {
      const res = await request(app)
        .put('/api/v1/staff/doi-mat-khau')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          MatKhauCu: 'password123',
          MatKhauMoi: 'password123',
          XacNhanMatKhauMoi: 'password123',
        });

      expect(res.status).toBe(422);
      expect(res.body.errors.MatKhauMoi[0]).toContain('phải khác mật khẩu cũ');
    });

    it('4. Succeeds with correct old password and revokes refresh tokens', async () => {
      // Create a dummy active refresh token first
      const dummyToken = await prisma.refreshToken.create({
        data: {
          MaTaiKhoan: staffAccount.MaTaiKhoan,
          TokenHash: 'staff_dummy_hash_abc123',
          HetHanLuc: new Date(Date.now() + 3600000), // 1 hour
          BiThuHoi: false,
        },
      });

      const res = await request(app)
        .put('/api/v1/staff/doi-mat-khau')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          MatKhauCu: 'password123',
          MatKhauMoi: 'newpassword456',
          XacNhanMatKhauMoi: 'newpassword456',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Đổi mật khẩu thành công');

      // Verify dummy refresh token was revoked
      const updatedToken = await prisma.refreshToken.findUnique({
        where: { MaRefreshToken: dummyToken.MaRefreshToken },
      });
      expect(updatedToken?.BiThuHoi).toBe(true);

      // Restore original password so subsequent runs don't break
      const bcrypt = require('bcrypt');
      const restored = await bcrypt.hash('password123', 4);
      await prisma.taiKhoan.update({
        where: { MaTaiKhoan: staffAccount.MaTaiKhoan },
        data: { MatKhau: restored },
      });
    });

    it('5. Fails if new password is shorter than 6 characters', async () => {
      const res = await request(app)
        .put('/api/v1/staff/doi-mat-khau')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          MatKhauCu: 'password123',
          MatKhauMoi: '123',
          XacNhanMatKhauMoi: '123',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('6. Guest (no token) is rejected with 401', async () => {
      const res = await request(app)
        .put('/api/v1/staff/doi-mat-khau')
        .send({ MatKhauCu: 'a', MatKhauMoi: 'b12345', XacNhanMatKhauMoi: 'b12345' });
      expect(res.status).toBe(401);
    });

    it('7. CUSTOMER is rejected with 403', async () => {
      const res = await request(app)
        .put('/api/v1/staff/doi-mat-khau')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ MatKhauCu: 'password123', MatKhauMoi: 'newpassword456', XacNhanMatKhauMoi: 'newpassword456' });
      expect(res.status).toBe(403);
    });

    it('8. ADMIN is rejected with 403', async () => {
      const res = await request(app)
        .put('/api/v1/staff/doi-mat-khau')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ MatKhauCu: 'password123', MatKhauMoi: 'newpassword456', XacNhanMatKhauMoi: 'newpassword456' });
      expect(res.status).toBe(403);
    });
  });
});
