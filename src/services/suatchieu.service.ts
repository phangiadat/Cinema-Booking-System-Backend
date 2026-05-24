import { findShowtimeForSeatMap } from '../repositories/suatchieu.repository';
import { releaseExpiredHolds } from '../repositories/ghesuatchieu.repository';
import { NotFoundError } from '../utils/errors';

/**
 * Service to get seat map and seat statuses for a showtime
 */
export const getSeatMap = async (maSuatChieu: string) => {
  const now = new Date();

  // 1. Release expired holds for this showtime first
  await releaseExpiredHolds(now, maSuatChieu);

  // 2. Fetch showtime with all related entities
  const sc = await findShowtimeForSeatMap(maSuatChieu);
  if (!sc) {
    throw new NotFoundError(`Không tìm thấy suất chiếu với mã: ${maSuatChieu}`);
  }

  // 3. Format/Calculate showtime times
  let gioKetThuc = (sc as any).GioKetThuc;
  if (!gioKetThuc) {
    gioKetThuc = new Date(sc.GioChieu);
    gioKetThuc.setMinutes(gioKetThuc.getMinutes() + sc.Phim.ThoiLuong);
  } else {
    gioKetThuc = new Date(gioKetThuc);
  }

  const basePrice = Number(sc.GiaVeGoc);
  const roomSurcharge = Number(sc.PhongChieu.LoaiPhong.PhuThu);
  const daySurcharge = Number(sc.LoaiNgay.PhuThu);

  // 4. Map Ghes list
  const ghes = sc.GheSuatChieus.map((gsc) => {
    const seatSurcharge = Number(gsc.Ghe.LoaiGhe.PhuThu);
    const calculatedPrice = basePrice + roomSurcharge + daySurcharge + seatSurcharge;

    // Check if the hold is expired in-memory (redundancy fallback)
    const isExpired = gsc.TrangThai === 'DANG_GIU' && gsc.ThoiGianGiuGhe && new Date(gsc.ThoiGianGiuGhe) < now;
    const finalStatus = isExpired ? 'TRONG' : gsc.TrangThai;
    const finalExpiry = isExpired ? null : gsc.ThoiGianGiuGhe;

    return {
      MaGheSuatChieu: gsc.MaGheSuatChieu,
      MaGhe: gsc.MaGhe,
      TenGhe: `${gsc.Ghe.ViTriDay}${gsc.Ghe.ViTriCot}`,
      LoaiGhe: gsc.Ghe.MaLoaiGhe,
      SoThuTu: gsc.Ghe.ViTriCot,
      TenLoaiGhe: gsc.Ghe.LoaiGhe.TenLoaiGhe,
      GiaPhuThuLoaiGhe: seatSurcharge,
      TrangThai: finalStatus,
      ThoiGianGiuGhe: finalExpiry,
      GiaVeTinhToan: calculatedPrice,
    };
  });

  return {
    SuatChieu: {
      MaSuatChieu: sc.MaSuatChieu,
      NgayChieu: sc.NgayChieu,
      GioChieu: sc.GioChieu,
      GioKetThuc: gioKetThuc,
      GiaVeGoc: basePrice,
    },
    Phim: {
      MaPhim: sc.Phim.MaPhim,
      TenPhim: sc.Phim.TenPhim,
      ThoiLuong: sc.Phim.ThoiLuong,
      GioiHanTuoi: sc.Phim.GioiHanTuoi,
    },
    PhongChieu: {
      MaPhongChieu: sc.PhongChieu.MaPhong,
      TenPhong: sc.PhongChieu.TenPhong,
    },
    LoaiPhong: {
      MaLoaiPhong: sc.PhongChieu.LoaiPhong.MaLoaiPhong,
      TenLoaiPhong: sc.PhongChieu.LoaiPhong.TenLoaiPhong,
      GiaPhuThu: roomSurcharge,
    },
    SoDoGhe: {
      MaSoDoGhe: sc.PhongChieu.SoDoGhe.MaSoDo,
      TongHang: sc.PhongChieu.SoDoGhe.SoHang,
      TongCot: sc.PhongChieu.SoDoGhe.SoCot,
      CauTruc: null,
    },
    Ghe: ghes,
  };
};
