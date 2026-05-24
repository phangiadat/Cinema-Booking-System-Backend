import { findCustomerByAccountId, findBookingForCustomer } from '../repositories/datve.repository';
import {
  findSuccessfulTransactionByBooking,
  findPendingRefundByBooking,
  createRefundRequest,
  findRefundRequestsByCustomer,
  countRefundRequestsByCustomer,
} from '../repositories/hoantien.repository';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { RefundRequestInput, RefundListQueryInput } from '../validators/hoantien.validator';

/**
 * Customer submits a refund request for a booking
 */
export const yeuCauHoanTien = async (maTaiKhoan: string, input: RefundRequestInput) => {
  const customer = await findCustomerByAccountId(maTaiKhoan);
  if (!customer) {
    throw new BadRequestError('Tài khoản không phải là khách hàng hợp lệ.');
  }

  // Find booking and ensure it belongs to customer
  const booking = await findBookingForCustomer(input.MaPhieuDat, customer.MaKhachHang);
  if (!booking) {
    throw new NotFoundError(`Không tìm thấy phiếu đặt vé với mã: ${input.MaPhieuDat}`);
  }

  // Check booking status (must be paid or cancelled already)
  if (booking.TrangThai !== 'DA_THANH_TOAN' && booking.TrangThai !== 'DA_HUY') {
    throw new BadRequestError('Chỉ có thể yêu cầu hoàn tiền cho vé đã thanh toán hoặc đã hủy.');
  }

  // Check showtime has not started yet
  const showtime = booking.ChiTietDatVes[0]?.GheSuatChieu?.SuatChieu;
  if (!showtime) {
    throw new BadRequestError('Thông tin suất chiếu không hợp lệ.');
  }

  const now = new Date();
  const showtimeStart = new Date(showtime.NgayChieu);
  const gioChieu = new Date(showtime.GioChieu);
  showtimeStart.setHours(gioChieu.getHours(), gioChieu.getMinutes(), gioChieu.getSeconds());

  if (showtimeStart <= now) {
    throw new BadRequestError('Suất chiếu đã bắt đầu hoặc đã diễn ra, không thể yêu cầu hoàn tiền.');
  }

  // Prevent duplicate pending refund request
  const pendingRefund = await findPendingRefundByBooking(input.MaPhieuDat);
  if (pendingRefund) {
    throw new BadRequestError('Đã tồn tại yêu cầu hoàn tiền đang chờ xử lý cho phiếu đặt vé này.');
  }

  // Find successful transaction
  const successfulTx = await findSuccessfulTransactionByBooking(input.MaPhieuDat);
  if (!successfulTx) {
    throw new BadRequestError('Không tìm thấy giao dịch thanh toán thành công cho phiếu đặt vé này.');
  }

  // Create refund request using transaction (sets booking to DA_HUY + creates LichSuHoanTien)
  const refund = await createRefundRequest(
    input.MaPhieuDat,
    successfulTx.MaGiaoDich,
    Number(successfulTx.SoTien),
    input.LyDo,
  );

  return {
    MaHoanTien: refund.MaHoanTien,
    MaGiaoDich: refund.MaGiaoDich,
    SoTienHoan: Number(refund.SoTienHoan),
    LyDo: refund.LyDo,
    TrangThai: refund.TrangThai,
    NgayHoanTien: refund.NgayHoanTien,
    NgayTao: refund.NgayTao,
  };
};

/**
 * Retrieve paginated list of refund requests submitted by the logged-in customer
 */
export const getHoanTienCuaToi = async (maTaiKhoan: string, query: RefundListQueryInput) => {
  const customer = await findCustomerByAccountId(maTaiKhoan);
  if (!customer) {
    throw new BadRequestError('Tài khoản không phải là khách hàng hợp lệ.');
  }

  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    findRefundRequestsByCustomer(customer.MaKhachHang, skip, limit),
    countRefundRequestsByCustomer(customer.MaKhachHang),
  ]);

  const formattedItems = items.map((refund) => {
    const gd = refund.GiaoDich;
    const booking = gd.PhieuDatVe;
    const firstDetail = booking.ChiTietDatVes[0];
    const suatChieu = firstDetail?.GheSuatChieu?.SuatChieu;
    const movieSummary = suatChieu
      ? {
          TenPhim: suatChieu.Phim.TenPhim,
          NgayChieu: suatChieu.NgayChieu,
          GioChieu: suatChieu.GioChieu,
        }
      : null;

    return {
      MaHoanTien: refund.MaHoanTien,
      SoTienHoan: Number(refund.SoTienHoan),
      LyDo: refund.LyDo,
      TrangThai: refund.TrangThai,
      NgayHoanTien: refund.NgayHoanTien,
      NgayTao: refund.NgayTao,
      GiaoDich: {
        MaGiaoDich: gd.MaGiaoDich,
        PhuongThuc: gd.PhuongThuc,
        SoTien: Number(gd.SoTien),
      },
      PhieuDatVe: {
        MaPhieuDat: booking.MaPhieuDat,
        TongTien: Number(booking.TongTien),
        TrangThai: booking.TrangThai,
        Movie: movieSummary,
      },
    };
  });

  return {
    items: formattedItems,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
