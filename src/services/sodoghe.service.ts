import { SoDoGhe } from '@prisma/client';
import {
  findSoDoGhes,
  findSoDoGheById,
  createSoDoGhe,
  updateSoDoGhe,
  deleteSoDoGhe,
  countRoomsWithSoDoGhe,
} from '../repositories/sodoghe.repository';
import { CreateSoDoGheInput, UpdateSoDoGheInput } from '../validators/sodoghe.validator';
import { NotFoundError, BadRequestError } from '../utils/errors';

const assertSoDoGheExists = async (maSoDo: string): Promise<SoDoGhe> => {
  const sodoghe = await findSoDoGheById(maSoDo);
  if (!sodoghe) {
    throw new NotFoundError(`Không tìm thấy sơ đồ ghế mẫu với mã: ${maSoDo}`);
  }
  return sodoghe;
};

export const getSoDoGhes = async (): Promise<SoDoGhe[]> => {
  return findSoDoGhes();
};

export const getSoDoGheById = async (maSoDo: string): Promise<SoDoGhe> => {
  return assertSoDoGheExists(maSoDo);
};

export const taoSoDoGhe = async (input: CreateSoDoGheInput): Promise<SoDoGhe> => {
  return createSoDoGhe({
    TenSoDo: input.TenSoDo,
    SoHang: input.SoHang,
    SoCot: input.SoCot,
    CauTruc: input.CauTruc,
    KhaDung: true,
  });
};

export const capNhatSoDoGhe = async (
  maSoDo: string,
  input: UpdateSoDoGheInput,
): Promise<SoDoGhe> => {
  const sodoghe = await assertSoDoGheExists(maSoDo);

  // If size is changing, verify it is not in use
  const isSizeChanging =
    (input.SoHang !== undefined && input.SoHang !== sodoghe.SoHang) ||
    (input.SoCot !== undefined && input.SoCot !== sodoghe.SoCot);

  if (isSizeChanging) {
    const roomsCount = await countRoomsWithSoDoGhe(maSoDo);
    if (roomsCount > 0) {
      throw new BadRequestError(
        'Không thể sửa số hàng hoặc số cột của sơ đồ ghế đang được phòng chiếu sử dụng',
      );
    }
  }

  return updateSoDoGhe(maSoDo, {
    TenSoDo: input.TenSoDo,
    SoHang: input.SoHang,
    SoCot: input.SoCot,
    CauTruc: input.CauTruc,
    KhaDung: input.KhaDung,
  });
};

export const xoaSoDoGhe = async (
  maSoDo: string,
): Promise<{ action: 'soft' | 'hard'; data: SoDoGhe | null }> => {
  await assertSoDoGheExists(maSoDo);

  const roomsCount = await countRoomsWithSoDoGhe(maSoDo);
  if (roomsCount > 0) {
    // Soft delete
    const data = await updateSoDoGhe(maSoDo, { KhaDung: false });
    return { action: 'soft', data };
  }

  // Hard delete
  await deleteSoDoGhe(maSoDo);
  return { action: 'hard', data: null };
};
