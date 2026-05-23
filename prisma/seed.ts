import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = "123456";

async function main() {
  console.log("🌱 Bắt đầu seed dữ liệu...");

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  // await prisma.nhanVien.deleteMany({});
  // await prisma.khachHang.deleteMany({});
  // await prisma.refreshToken.deleteMany({});
  // await prisma.taiKhoan.deleteMany({});
  // await prisma.phim.deleteMany({});
  // console.log('🗑️ Đã xóa sạch dữ liệu cũ trong Database.');
  // ========================
  // Tạo tài khoản Admin
  // ========================
  const admin = await prisma.taiKhoan.upsert({
    where: { TenDangNhap: "admin" },
    update: {},
    create: {
      TenDangNhap: "admin",
      MatKhau: hashedPassword,
      HoTen: "Quản trị viên",
      Email: "admin@cinema.com",
      SoDienThoai: "0901000001",
      GioiTinh: true,
      NgaySinh: new Date("1990-01-01"),
      VaiTro: Role.ADMIN,
      KhaDung: true,
      NhanVien: {
        create: {
          ChucVu: "Quản trị hệ thống",
          KhaDung: true,
        },
      },
    },
  });
  console.log(`✅ Đã tạo tài khoản Admin: ${admin.TenDangNhap}`);

  // ========================
  // Tạo tài khoản Nhân viên
  // ========================
  const staff = await prisma.taiKhoan.upsert({
    where: { TenDangNhap: "nhanvien01" },
    update: {},
    create: {
      TenDangNhap: "nhanvien01",
      MatKhau: hashedPassword,
      HoTen: "Nguyễn Văn An",
      Email: "nhanvien01@cinema.com",
      SoDienThoai: "0901000002",
      GioiTinh: true,
      NgaySinh: new Date("1995-06-15"),
      VaiTro: Role.STAFF,
      KhaDung: true,
      NhanVien: {
        create: {
          ChucVu: "Nhân viên bán vé",
          KhaDung: true,
        },
      },
    },
  });
  console.log(`✅ Đã tạo tài khoản Nhân viên: ${staff.TenDangNhap}`);

  // ========================
  // Tạo tài khoản Khách hàng
  // ========================
  const customer = await prisma.taiKhoan.upsert({
    where: { TenDangNhap: "khachhang01" },
    update: {},
    create: {
      TenDangNhap: "khachhang01",
      MatKhau: hashedPassword,
      HoTen: "Trần Thị Bích",
      Email: "khachhang01@gmail.com",
      SoDienThoai: "0901000003",
      GioiTinh: false,
      NgaySinh: new Date("2000-03-20"),
      VaiTro: Role.CUSTOMER,
      KhaDung: true,
      KhachHang: {
        create: {
          KhaDung: true,
        },
      },
    },
  });
  console.log(`✅ Đã tạo tài khoản Khách hàng: ${customer.TenDangNhap}`);

  // ========================
  // Tạo dữ liệu Phim
  // ========================
  const phimData = [
    {
      TenPhim: "Avengers: Endgame",
      ThoiLuong: 181,
      TheLoai: "Hành động, Khoa học viễn tưởng",
      NgayKhoiChieu: new Date("2024-05-01"),
      NgayKetThuc: new Date("2024-07-01"),
      DaoDien: "Anthony Russo, Joe Russo",
      DienVien: "Robert Downey Jr., Chris Evans, Mark Ruffalo, Chris Hemsworth",
      GioiHanTuoi: "C13",
      NoiDung:
        "Sau sự kiện thảm khốc của Infinity War, các Avengers còn sống phải đối mặt với nhiệm vụ cuối cùng để đảo ngược hành động của Thanos và khôi phục lại trật tự vũ trụ.",
      Trailer: "https://www.youtube.com/watch?v=TcMBFSGVi1c",
      HinhAnh: "https://example.com/images/avengers-endgame.jpg",
      KhaDung: true,
    },
    {
      TenPhim: "Inception",
      ThoiLuong: 148,
      TheLoai: "Khoa học viễn tưởng, Hành động",
      NgayKhoiChieu: new Date("2024-06-15"),
      NgayKetThuc: null,
      DaoDien: "Christopher Nolan",
      DienVien: "Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page",
      GioiHanTuoi: "C13",
      NoiDung:
        "Dom Cobb là tên trộm tài năng với khả năng xâm nhập vào giấc mơ của người khác để đánh cắp bí mật từ tiềm thức của họ.",
      Trailer: "https://www.youtube.com/watch?v=YoHD9XEInc0",
      HinhAnh: "https://example.com/images/inception.jpg",
      KhaDung: true,
    },
    {
      TenPhim: "The Lion King",
      ThoiLuong: 118,
      TheLoai: "Hoạt hình, Gia đình",
      NgayKhoiChieu: new Date("2024-07-01"),
      NgayKetThuc: new Date("2024-09-01"),
      DaoDien: "Jon Favreau",
      DienVien: "Donald Glover, Beyoncé, Seth Rogen, Chiwetel Ejiofor",
      GioiHanTuoi: "P",
      NoiDung:
        "Simba, một con sư tử con, phải trốn chạy khỏi vương quốc của mình sau cái chết bi thảm của cha mình Mufasa.",
      Trailer: "https://www.youtube.com/watch?v=7TavVZMewpY",
      HinhAnh: "https://example.com/images/lion-king.jpg",
      KhaDung: true,
    },
    {
      TenPhim: "Joker",
      ThoiLuong: 122,
      TheLoai: "Tâm lý, Tội phạm",
      NgayKhoiChieu: new Date("2024-08-01"),
      NgayKetThuc: null,
      DaoDien: "Todd Phillips",
      DienVien: "Joaquin Phoenix, Robert De Niro, Zazie Beetz",
      GioiHanTuoi: "C18",
      NoiDung:
        "Câu chuyện về Arthur Fleck, một diễn viên hài bị xã hội ruồng bỏ, dần trở thành tên tội phạm huyền thoại Joker.",
      Trailer: "https://www.youtube.com/watch?v=zAGVQLHvwOY",
      HinhAnh: "https://example.com/images/joker.jpg",
      KhaDung: true,
    },
    {
      TenPhim: "Spider-Man: No Way Home",
      ThoiLuong: 148,
      TheLoai: "Hành động, Khoa học viễn tưởng",
      NgayKhoiChieu: new Date("2024-09-15"),
      NgayKetThuc: new Date("2024-11-15"),
      DaoDien: "Jon Watts",
      DienVien: "Tom Holland, Zendaya, Benedict Cumberbatch, Jamie Foxx",
      GioiHanTuoi: "C13",
      NoiDung:
        "Peter Parker tìm đến Doctor Strange để giúp thế giới quên rằng anh là Spider-Man, nhưng phép thuật đã mở ra cánh cửa đến đa vũ trụ.",
      Trailer: "https://www.youtube.com/watch?v=JfVOs4VSpmA",
      HinhAnh: "https://example.com/images/spiderman-no-way-home.jpg",
      KhaDung: true,
    },
    {
      TenPhim: "Interstellar",
      ThoiLuong: 169,
      TheLoai: "Khoa học viễn tưởng, Phiêu lưu",
      NgayKhoiChieu: new Date("2024-10-01"),
      NgayKetThuc: null,
      DaoDien: "Christopher Nolan",
      DienVien: "Matthew McConaughey, Anne Hathaway, Jessica Chastain",
      GioiHanTuoi: "C13",
      NoiDung:
        "Một nhóm nhà du hành vũ trụ du hành qua lỗ sâu trong vũ trụ để đảm bảo sự sống còn của nhân loại.",
      Trailer: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
      HinhAnh: "https://example.com/images/interstellar.jpg",
      KhaDung: true,
    },
  ];

  for (const phim of phimData) {
    await prisma.phim.create({ data: phim });
    console.log(`🎬 Đã tạo phim: ${phim.TenPhim}`);
  }

  console.log("\n✨ Seed dữ liệu hoàn tất!");
  console.log("📋 Tài khoản mặc định:");
  console.log("   Admin    - TenDangNhap: admin        | MatKhau: 123456");
  console.log("   Nhân viên - TenDangNhap: nhanvien01  | MatKhau: 123456");
  console.log("   Khách hàng - TenDangNhap: khachhang01 | MatKhau: 123456");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi seed dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
