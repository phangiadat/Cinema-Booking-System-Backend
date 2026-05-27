import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/prisma';
import { Role } from '@prisma/client';
import {
  cleanupTestData,
  createTestAdmin,
  createTestCustomer,
  createTestStaff,
  loginAndGetToken,
} from '../helpers';

describe('📅 Quản Lý Ca Làm Việc & Lịch Trực Integration Tests', () => {
  let adminToken: string;
  let customerToken: string;
  let staffUser: any;
  let maNhanVien: string;

  beforeAll(async () => {
    await cleanupTestData();

    await createTestAdmin('admin_ca_test', 'password123');
    await createTestCustomer('cust_ca_test', 'password123');
    staffUser = await createTestStaff('staff_ca_test', 'password123');

    // Retrieve staff's MaNhanVien
    const dbStaff = await prisma.nhanVien.findFirst({
      where: { MaTaiKhoan: staffUser.MaTaiKhoan },
    });
    maNhanVien = dbStaff!.MaNhanVien;

    adminToken = await loginAndGetToken(app, 'admin_ca_test', 'password123');
    customerToken = await loginAndGetToken(app, 'cust_ca_test', 'password123');
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear shift details and templates
    await prisma.chiTietCaLamViec.deleteMany({});
    await prisma.caLamViec.deleteMany({});
  });

  describe('🔑 Authorization', () => {
    it('should block non-admin from creating a shift template', async () => {
      const res = await request(app)
        .post('/api/v1/admin/ca-lam-viec')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          TenCa: 'Morning Shift',
          GioBatDau: '08:00:00',
          GioKetThuc: '12:00:00',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('📦 Shift Template CRUD', () => {
    it('should create and list shift templates successfully', async () => {
      const createRes = await request(app)
        .post('/api/v1/admin/ca-lam-viec')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          TenCa: 'Morning Ca 1',
          GioBatDau: '08:00:00',
          GioKetThuc: '12:00:00',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data.TenCa).toBe('Morning Ca 1');

      const maCa = createRes.body.data.MaCa;

      const listRes = await request(app)
        .get('/api/v1/admin/ca-lam-viec')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data).toHaveLength(1);
      expect(listRes.body.data[0].MaCa).toBe(maCa);
    });

    it('should reject shift creation if start time is after end time', async () => {
      const res = await request(app)
        .post('/api/v1/admin/ca-lam-viec')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          TenCa: 'Invalid Ca',
          GioBatDau: '14:00:00',
          GioKetThuc: '10:00:00',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('nhỏ hơn giờ kết thúc');
    });

    it('should update a shift template successfully', async () => {
      const ca = await prisma.caLamViec.create({
        data: {
          TenCa: 'Evening Shift',
          GioBatDau: new Date('1970-01-01T18:00:00Z'),
          GioKetThuc: new Date('1970-01-01T22:00:00Z'),
        },
      });

      const res = await request(app)
        .put(`/api/v1/admin/ca-lam-viec/${ca.MaCa}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          TenCa: 'Night Shift',
          GioKetThuc: '23:00:00',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.TenCa).toBe('Night Shift');
    });

    it('should hard delete shift template if unused', async () => {
      const ca = await prisma.caLamViec.create({
        data: {
          TenCa: 'Unused Ca',
          GioBatDau: new Date('1970-01-01T08:00:00Z'),
          GioKetThuc: new Date('1970-01-01T12:00:00Z'),
        },
      });

      const res = await request(app)
        .delete(`/api/v1/admin/ca-lam-viec/${ca.MaCa}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('vĩnh viễn thành công');

      const dbCa = await prisma.caLamViec.findUnique({
        where: { MaCa: ca.MaCa },
      });
      expect(dbCa).toBeNull();
    });

    it('should soft delete shift template if already assigned to a schedule', async () => {
      const ca = await prisma.caLamViec.create({
        data: {
          TenCa: 'Used Shift',
          GioBatDau: new Date('1970-01-01T08:00:00Z'),
          GioKetThuc: new Date('1970-01-01T12:00:00Z'),
        },
      });

      await prisma.chiTietCaLamViec.create({
        data: {
          MaCa: ca.MaCa,
          MaNhanVien: maNhanVien,
          NgayLamViec: new Date('2026-06-01'),
        },
      });

      const res = await request(app)
        .delete(`/api/v1/admin/ca-lam-viec/${ca.MaCa}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('chỉ ẩn trạng thái khả dụng');

      const dbCa = await prisma.caLamViec.findUnique({
        where: { MaCa: ca.MaCa },
      });
      expect(dbCa?.KhaDung).toBe(false);
    });
  });

  describe('🗓️ Shift Scheduling (Lịch Trực)', () => {
    let testCa: any;

    beforeEach(async () => {
      testCa = await prisma.caLamViec.create({
        data: {
          TenCa: 'Morning Shift',
          GioBatDau: new Date('1970-01-01T08:00:00Z'),
          GioKetThuc: new Date('1970-01-01T12:00:00Z'),
        },
      });
    });

    it('should assign a shift to staff and retrieve schedule', async () => {
      const assignRes = await request(app)
        .post('/api/v1/admin/ca-lam-viec/phan-ca')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          MaNhanVien: maNhanVien,
          MaCa: testCa.MaCa,
          NgayLamViec: '2026-06-05',
        });

      expect(assignRes.status).toBe(201);
      expect(assignRes.body.success).toBe(true);
      expect(assignRes.body.data.MaCa).toBe(testCa.MaCa);

      const maChiTietCa = assignRes.body.data.MaChiTietCa;

      // Get schedules (Lịch Trực)
      const listRes = await request(app)
        .get('/api/v1/admin/ca-lam-viec/phan-ca/lich-truc')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          tuNgay: '2026-06-01',
          denNgay: '2026-06-10',
          maNhanVien: maNhanVien,
        });

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);
      expect(listRes.body.data[0].MaChiTietCa).toBe(maChiTietCa);
    });

    it('should reject assigning staff to same shift on same date twice (duplicate)', async () => {
      // Create first assignment
      await prisma.chiTietCaLamViec.create({
        data: {
          MaCa: testCa.MaCa,
          MaNhanVien: maNhanVien,
          NgayLamViec: new Date('2026-06-05'),
        },
      });

      // Try assigning again
      const res = await request(app)
        .post('/api/v1/admin/ca-lam-viec/phan-ca')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          MaNhanVien: maNhanVien,
          MaCa: testCa.MaCa,
          NgayLamViec: '2026-06-05',
        });

      expect(res.status).toBe(409); // Conflict
      expect(res.body.message).toContain('đã được xếp vào ca này');
    });

    it('should remove a shift assignment successfully', async () => {
      const assigned = await prisma.chiTietCaLamViec.create({
        data: {
          MaCa: testCa.MaCa,
          MaNhanVien: maNhanVien,
          NgayLamViec: new Date('2026-06-05'),
        },
      });

      const res = await request(app)
        .delete(`/api/v1/admin/ca-lam-viec/phan-ca/${assigned.MaChiTietCa}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Hủy phân công ca trực thành công');

      const dbAssigned = await prisma.chiTietCaLamViec.findUnique({
        where: { MaChiTietCa: assigned.MaChiTietCa },
      });
      expect(dbAssigned).toBeNull();
    });

    it('should toggle shift assignment status successfully', async () => {
      const assigned = await prisma.chiTietCaLamViec.create({
        data: {
          MaCa: testCa.MaCa,
          MaNhanVien: maNhanVien,
          NgayLamViec: new Date('2026-06-05'),
          KhaDung: true,
        },
      });

      // 1. Toggle to false
      const res1 = await request(app)
        .patch(`/api/v1/admin/ca-lam-viec/phan-ca/${assigned.MaChiTietCa}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res1.status).toBe(200);
      expect(res1.body.data.KhaDung).toBe(false);

      // 2. Toggle to true
      const res2 = await request(app)
        .patch(`/api/v1/admin/ca-lam-viec/phan-ca/${assigned.MaChiTietCa}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res2.status).toBe(200);
      expect(res2.body.data.KhaDung).toBe(true);
    });
  });
});
