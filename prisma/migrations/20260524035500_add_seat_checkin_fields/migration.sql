-- AlterTable
ALTER TABLE `chi_tiet_dat_ve` ADD COLUMN `DaCheckIn` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `MaNhanVienCheckIn` VARCHAR(36) NULL,
    ADD COLUMN `ThoiGianCheckIn` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `ghe_suat_chieu` ADD COLUMN `MaTaiKhoanGiu` VARCHAR(36) NULL,
    ADD COLUMN `ThoiGianGiuGhe` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `chi_tiet_dat_ve_MaNhanVienCheckIn_idx` ON `chi_tiet_dat_ve`(`MaNhanVienCheckIn`);

-- AddForeignKey
ALTER TABLE `ghe_suat_chieu` ADD CONSTRAINT `ghe_suat_chieu_MaTaiKhoanGiu_fkey` FOREIGN KEY (`MaTaiKhoanGiu`) REFERENCES `tai_khoan`(`MaTaiKhoan`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chi_tiet_dat_ve` ADD CONSTRAINT `chi_tiet_dat_ve_MaNhanVienCheckIn_fkey` FOREIGN KEY (`MaNhanVienCheckIn`) REFERENCES `nhan_vien`(`MaNhanVien`) ON DELETE SET NULL ON UPDATE CASCADE;
