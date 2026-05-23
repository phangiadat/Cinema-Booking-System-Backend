import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/prisma';
import { GioiHanTuoi, Role, TrangThaiGheSuatChieu } from '@prisma/client';
import {
  cleanupTestData,
  createTestAdmin,
  createTestCustomer,
  loginAndGetToken,
  createTestMovie,
} from '../helpers';
import { runReleaseExpiredSeatHolds } from '../../src/jobs/releaseExpiredSeatHolds.job';

describe('🎟️ Seat Map and Hold Integration Tests', () => {
  let adminToken: string;
  let customerToken: string;
  let customer2Token: string;
  let customerAccount: any;
  let customer2Account: any;
  let showtime: any;
  let movie: any;
  let seat1: any;
  let seat2: any;
  
  beforeAll(async () => {
    await cleanupTestData();

    // Create test accounts
    customerAccount = await createTestCustomer('customer_test_1', 'password123');
    customer2Account = await createTestCustomer('customer_test_2', 'password123');
    await createTestAdmin('admin_test_1', 'password123');

    adminToken = await loginAndGetToken(app, 'admin_test_1', 'password123');
    customerToken = await loginAndGetToken(app, 'customer_test_1', 'password123');
    customer2Token = await loginAndGetToken(app, 'customer_test_2', 'password123');
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up showtimes and bookings between tests to ensure isolated runs
    await prisma.chiTietCaLamViec.deleteMany({});
    await prisma.caLamViec.deleteMany({});
    await prisma.lichSuHoanTien.deleteMany({});
    await prisma.giaoDich.deleteMany({});
    await prisma.chiTietDatVe.deleteMany({});
    await prisma.phieuDatVe.deleteMany({});
    await prisma.gheSuatChieu.deleteMany({});
    await prisma.suatChieu.deleteMany({});
    await prisma.danhGia.deleteMany({});
    await prisma.phim.deleteMany({});
    await prisma.ghe.deleteMany({});
    await prisma.phongChieu.deleteMany({});
    await prisma.loaiGhe.deleteMany({});
    await prisma.loaiPhong.deleteMany({});
    await prisma.soDoGhe.deleteMany({});
    await prisma.loaiNgay.deleteMany({});

    // Seed a standard room and showtime
    movie = await createTestMovie({ TenPhim: 'Hold Test Phim', ThoiLuong: 120 });
    const soDo = await prisma.soDoGhe.create({
      data: { TenSoDo: 'Test Sơ Đồ', SoHang: 5, SoCot: 5 },
    });
    const loaiPhong = await prisma.loaiPhong.create({
      data: { TenLoaiPhong: 'IMAX', PhuThu: 20000.0 },
    });
    const phong = await prisma.phongChieu.create({
      data: { TenPhong: 'IMAX Room', MaLoaiPhong: loaiPhong.MaLoaiPhong, MaSoDo: soDo.MaSoDo },
    });
    const loaiNgay = await prisma.loaiNgay.create({
      data: { TenLoaiNgay: 'Weekend', PhuThu: 10000.0 },
    });
    const loaiGhe = await prisma.loaiGhe.create({
      data: { TenLoaiGhe: 'VIP', PhuThu: 15000.0 },
    });

    const g1 = await prisma.ghe.create({
      data: { ViTriDay: 'A', ViTriCot: 1, MaPhong: phong.MaPhong, MaLoaiGhe: loaiGhe.MaLoaiGhe },
    });
    const g2 = await prisma.ghe.create({
      data: { ViTriDay: 'A', ViTriCot: 2, MaPhong: phong.MaPhong, MaLoaiGhe: loaiGhe.MaLoaiGhe },
    });

    // Create a future showtime
    const date = new Date();
    date.setDate(date.getDate() + 3);
    date.setHours(20, 0, 0, 0);

    showtime = await prisma.suatChieu.create({
      data: {
        MaPhim: movie.MaPhim,
        MaPhong: phong.MaPhong,
        MaLoaiNgay: loaiNgay.MaLoaiNgay,
        NgayChieu: date,
        GioChieu: date,
        GiaVeGoc: 60000.0,
      },
    });

    seat1 = await prisma.gheSuatChieu.create({
      data: {
        MaSuatChieu: showtime.MaSuatChieu,
        MaGhe: g1.MaGhe,
        TrangThai: 'TRONG',
        GiaVe: 60000.0,
      },
    });
    seat2 = await prisma.gheSuatChieu.create({
      data: {
        MaSuatChieu: showtime.MaSuatChieu,
        MaGhe: g2.MaGhe,
        TrangThai: 'TRONG',
        GiaVe: 60000.0,
      },
    });
  });

  describe('🔍 GET /api/v1/suat-chieu/:maSuatChieu/ghe', () => {
    it('should return seat map with calculated prices and hide MaTaiKhoanGiu', async () => {
      const res = await request(app).get(`/api/v1/suat-chieu/${showtime.MaSuatChieu}/ghe`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.SuatChieu.MaSuatChieu).toBe(showtime.MaSuatChieu);
      expect(res.body.data.PhongChieu.TenPhong).toBe('IMAX Room');
      expect(res.body.data.Ghe).toHaveLength(2);

      // Verify calculated price: GiaVeGoc (60000) + LoaiPhong (20000) + LoaiNgay (10000) + LoaiGhe (15000) = 105000
      const scSeat = res.body.data.Ghe[0];
      expect(scSeat.GiaVeTinhToan).toBe(105000);
      
      // Ensure MaTaiKhoanGiu is hidden from API response
      expect(scSeat.MaTaiKhoanGiu).toBeUndefined();
    });
  });

  describe('🔒 POST /api/v1/dat-ve/giu-ghe', () => {
    it('should allow CUSTOMER to hold available seats', async () => {
      const res = await request(app)
        .post('/api/v1/dat-ve/giu-ghe')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          MaSuatChieu: showtime.MaSuatChieu,
          DanhSachMaGheSuatChieu: [seat1.MaGheSuatChieu, seat2.MaGheSuatChieu],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Giữ ghế thành công');
      expect(res.body.data.DanhSachGhe).toHaveLength(2);

      // Verify database
      const dbSeat = await prisma.gheSuatChieu.findUnique({
        where: { MaGheSuatChieu: seat1.MaGheSuatChieu },
      });
      expect(dbSeat?.TrangThai).toBe('DANG_GIU');
      expect(dbSeat?.MaTaiKhoanGiu).toBe(customerAccount.MaTaiKhoan);
      expect(dbSeat?.ThoiGianGiuGhe).not.toBeNull();
    });

    it('should block non-CUSTOMER roles from calling the hold endpoint', async () => {
      const res = await request(app)
        .post('/api/v1/dat-ve/giu-ghe')
        .set('Authorization', `Bearer ${adminToken}`) // Admin login
        .send({
          MaSuatChieu: showtime.MaSuatChieu,
          DanhSachMaGheSuatChieu: [seat1.MaGheSuatChieu],
        });

      expect(res.status).toBe(403);
    });

    it('should block holding booked (DA_DAT) seats', async () => {
      // Set seat1 to DA_DAT
      await prisma.gheSuatChieu.update({
        where: { MaGheSuatChieu: seat1.MaGheSuatChieu },
        data: { TrangThai: TrangThaiGheSuatChieu.DA_DAT },
      });

      const res = await request(app)
        .post('/api/v1/dat-ve/giu-ghe')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          MaSuatChieu: showtime.MaSuatChieu,
          DanhSachMaGheSuatChieu: [seat1.MaGheSuatChieu],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('đang được giữ bởi người khác');
    });

    it('should block holding seats active-held by another customer', async () => {
      const futureExpiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now
      await prisma.gheSuatChieu.update({
        where: { MaGheSuatChieu: seat1.MaGheSuatChieu },
        data: {
          TrangThai: 'DANG_GIU',
          ThoiGianGiuGhe: futureExpiry,
          MaTaiKhoanGiu: customer2Account.MaTaiKhoan,
        },
      });

      const res = await request(app)
        .post('/api/v1/dat-ve/giu-ghe')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          MaSuatChieu: showtime.MaSuatChieu,
          DanhSachMaGheSuatChieu: [seat1.MaGheSuatChieu],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('đang được giữ bởi người khác');
    });

    it('should allow customer to re-hold/extend their own held seats', async () => {
      const pastExpiry = new Date(Date.now() + 10 * 1000); // Expires in 10 seconds
      await prisma.gheSuatChieu.update({
        where: { MaGheSuatChieu: seat1.MaGheSuatChieu },
        data: {
          TrangThai: 'DANG_GIU',
          ThoiGianGiuGhe: pastExpiry,
          MaTaiKhoanGiu: customerAccount.MaTaiKhoan,
        },
      });

      const res = await request(app)
        .post('/api/v1/dat-ve/giu-ghe')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          MaSuatChieu: showtime.MaSuatChieu,
          DanhSachMaGheSuatChieu: [seat1.MaGheSuatChieu],
        });

      expect(res.status).toBe(200);
      
      const dbSeat = await prisma.gheSuatChieu.findUnique({
        where: { MaGheSuatChieu: seat1.MaGheSuatChieu },
      });
      // Verification: expiry extended to ~5 minutes from now (must be greater than pastExpiry)
      expect(dbSeat?.ThoiGianGiuGhe!.getTime()).toBeGreaterThan(pastExpiry.getTime());
    });

    it('should treat expired holds as available and let another customer hold them', async () => {
      const expiredTime = new Date(Date.now() - 5 * 1000); // Expired 5 seconds ago
      await prisma.gheSuatChieu.update({
        where: { MaGheSuatChieu: seat1.MaGheSuatChieu },
        data: {
          TrangThai: 'DANG_GIU',
          ThoiGianGiuGhe: expiredTime,
          MaTaiKhoanGiu: customer2Account.MaTaiKhoan,
        },
      });

      // Customer 1 tries to hold it -> should succeed because it is expired
      const res = await request(app)
        .post('/api/v1/dat-ve/giu-ghe')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          MaSuatChieu: showtime.MaSuatChieu,
          DanhSachMaGheSuatChieu: [seat1.MaGheSuatChieu],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbSeat = await prisma.gheSuatChieu.findUnique({
        where: { MaGheSuatChieu: seat1.MaGheSuatChieu },
      });
      expect(dbSeat?.MaTaiKhoanGiu).toBe(customerAccount.MaTaiKhoan);
    });
  });

  describe('🔓 POST /api/v1/dat-ve/huy-giu-ghe', () => {
    it('should allow customer to cancel their own held seats', async () => {
      await prisma.gheSuatChieu.update({
        where: { MaGheSuatChieu: seat1.MaGheSuatChieu },
        data: {
          TrangThai: 'DANG_GIU',
          ThoiGianGiuGhe: new Date(Date.now() + 2 * 60 * 1000),
          MaTaiKhoanGiu: customerAccount.MaTaiKhoan,
        },
      });

      const res = await request(app)
        .post('/api/v1/dat-ve/huy-giu-ghe')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          MaSuatChieu: showtime.MaSuatChieu,
          DanhSachMaGheSuatChieu: [seat1.MaGheSuatChieu],
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Huỷ giữ ghế thành công');

      const dbSeat = await prisma.gheSuatChieu.findUnique({
        where: { MaGheSuatChieu: seat1.MaGheSuatChieu },
      });
      expect(dbSeat?.TrangThai).toBe('TRONG');
      expect(dbSeat?.MaTaiKhoanGiu).toBeNull();
      expect(dbSeat?.ThoiGianGiuGhe).toBeNull();
    });

    it('should prevent customer from cancelling seats held by someone else', async () => {
      await prisma.gheSuatChieu.update({
        where: { MaGheSuatChieu: seat1.MaGheSuatChieu },
        data: {
          TrangThai: 'DANG_GIU',
          ThoiGianGiuGhe: new Date(Date.now() + 2 * 60 * 1000),
          MaTaiKhoanGiu: customer2Account.MaTaiKhoan, // held by customer 2
        },
      });

      const res = await request(app)
        .post('/api/v1/dat-ve/huy-giu-ghe')
        .set('Authorization', `Bearer ${customerToken}`) // Customer 1 attempts
        .send({
          MaSuatChieu: showtime.MaSuatChieu,
          DanhSachMaGheSuatChieu: [seat1.MaGheSuatChieu],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('không thuộc trạng thái đang giữ của bạn');
    });
  });

  describe('⏰ Expired Hold Cleanup Cron Job', () => {
    it('should release expired holds when cron releaseExpiredHolds job is executed', async () => {
      const expiredTime = new Date(Date.now() - 5000); // Expired 5 seconds ago
      await prisma.gheSuatChieu.update({
        where: { MaGheSuatChieu: seat1.MaGheSuatChieu },
        data: {
          TrangThai: 'DANG_GIU',
          ThoiGianGiuGhe: expiredTime,
          MaTaiKhoanGiu: customerAccount.MaTaiKhoan,
        },
      });

      // Invoke the release job manually
      const releasedCount = await runReleaseExpiredSeatHolds();
      expect(releasedCount).toBe(1);

      // Verify database
      const dbSeat = await prisma.gheSuatChieu.findUnique({
        where: { MaGheSuatChieu: seat1.MaGheSuatChieu },
      });
      expect(dbSeat?.TrangThai).toBe('TRONG');
      expect(dbSeat?.MaTaiKhoanGiu).toBeNull();
      expect(dbSeat?.ThoiGianGiuGhe).toBeNull();
    });
  });
});
