const express = require('express');
const prisma = require('../config/database');
const { authenticateCustomer } = require('../middleware/customerAuth');
const { AppError, asyncHandler, success } = require('../utils/helpers');

const router = express.Router();
router.use(authenticateCustomer);

const RESIDENCE_TYPES = ['HOUSE', 'CONDO', 'TOWNHOUSE', 'APARTMENT', 'OTHER'];
const VEHICLE_ACCESS = ['TRUCK_4_AND_6', 'TRUCK_4_ONLY', 'TRUCK_6_ONLY', 'NONE'];

function parseAddressBody(body) {
  const {
    label,
    firstName,
    lastName,
    phone,
    phoneAlt,
    houseNo,
    moo,
    village,
    floor,
    room,
    soi,
    road,
    postalCode,
    subdistrict,
    district,
    province,
    residenceType,
    residenceOther,
    hasElevator,
    vehicleAccess,
    lat,
    lng,
    mapAddress,
    isDefaultShipping,
    isDefaultTax,
  } = body;

  if (!label?.trim()) throw new AppError('Address label is required');
  if (!firstName?.trim() || !lastName?.trim()) throw new AppError('First name and last name are required');
  if (!phone?.trim()) throw new AppError('Phone is required');
  if (!houseNo?.trim()) throw new AppError('House number is required');
  if (!postalCode?.trim()) throw new AppError('Postal code is required');

  if (residenceType && !RESIDENCE_TYPES.includes(residenceType)) {
    throw new AppError('Invalid residence type');
  }
  if (vehicleAccess && !VEHICLE_ACCESS.includes(vehicleAccess)) {
    throw new AppError('Invalid vehicle access');
  }

  return {
    label: label.trim(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: phone.trim(),
    phoneAlt: phoneAlt?.trim() || null,
    houseNo: houseNo.trim(),
    moo: moo?.trim() || null,
    village: village?.trim() || null,
    floor: floor?.trim() || null,
    room: room?.trim() || null,
    soi: soi?.trim() || null,
    road: road?.trim() || null,
    postalCode: postalCode.trim(),
    subdistrict: subdistrict?.trim() || null,
    district: district?.trim() || null,
    province: province?.trim() || null,
    residenceType: residenceType || null,
    residenceOther: residenceType === 'OTHER' ? (residenceOther?.trim() || null) : null,
    hasElevator: typeof hasElevator === 'boolean' ? hasElevator : hasElevator === 'true' ? true : hasElevator === 'false' ? false : null,
    vehicleAccess: vehicleAccess || null,
    lat: lat != null && lat !== '' ? Number(lat) : null,
    lng: lng != null && lng !== '' ? Number(lng) : null,
    mapAddress: mapAddress?.trim() || null,
    isDefaultShipping: !!isDefaultShipping,
    isDefaultTax: !!isDefaultTax,
  };
}

function formatLine(addr) {
  const parts = [
    addr.houseNo,
    addr.moo ? `ม.${addr.moo}` : null,
    addr.village,
    addr.floor ? `ชั้น ${addr.floor}` : null,
    addr.room ? `ห้อง ${addr.room}` : null,
    addr.soi ? `ซ.${addr.soi}` : null,
    addr.road ? `ถ.${addr.road}` : null,
    addr.subdistrict,
    addr.district,
    addr.province,
    addr.postalCode,
  ].filter(Boolean);
  return parts.join(' ');
}

async function clearDefaults(tx, customerId, { shipping, tax }, exceptId = null) {
  if (shipping) {
    await tx.customerAddress.updateMany({
      where: { customerId, isDefaultShipping: true, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
      data: { isDefaultShipping: false },
    });
  }
  if (tax) {
    await tx.customerAddress.updateMany({
      where: { customerId, isDefaultTax: true, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
      data: { isDefaultTax: false },
    });
  }
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await prisma.customerAddress.findMany({
      where: { customerId: req.customer.id },
      orderBy: [{ isDefaultShipping: 'desc' }, { updatedAt: 'desc' }],
    });
    success(res, {
      items: items.map((a) => ({ ...a, formatted: formatLine(a) })),
      shippingDefault: items.find((a) => a.isDefaultShipping) || null,
      taxDefault: items.find((a) => a.isDefaultTax) || null,
    });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const address = await prisma.customerAddress.findFirst({
      where: { id: req.params.id, customerId: req.customer.id },
    });
    if (!address) throw new AppError('Address not found', 404);
    success(res, { ...address, formatted: formatLine(address) });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = parseAddressBody(req.body);
    const count = await prisma.customerAddress.count({ where: { customerId: req.customer.id } });
    if (count === 0) {
      data.isDefaultShipping = true;
    }

    const created = await prisma.$transaction(async (tx) => {
      await clearDefaults(tx, req.customer.id, {
        shipping: data.isDefaultShipping,
        tax: data.isDefaultTax,
      });
      return tx.customerAddress.create({
        data: { ...data, customerId: req.customer.id },
      });
    });

    success(res, { ...created, formatted: formatLine(created) }, 'Address created', 201);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.customerAddress.findFirst({
      where: { id: req.params.id, customerId: req.customer.id },
    });
    if (!existing) throw new AppError('Address not found', 404);

    const data = parseAddressBody(req.body);
    const updated = await prisma.$transaction(async (tx) => {
      await clearDefaults(tx, req.customer.id, {
        shipping: data.isDefaultShipping,
        tax: data.isDefaultTax,
      }, existing.id);
      return tx.customerAddress.update({
        where: { id: existing.id },
        data,
      });
    });

    success(res, { ...updated, formatted: formatLine(updated) }, 'Address updated');
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.customerAddress.findFirst({
      where: { id: req.params.id, customerId: req.customer.id },
    });
    if (!existing) throw new AppError('Address not found', 404);

    await prisma.customerAddress.delete({ where: { id: existing.id } });

    if (existing.isDefaultShipping) {
      const next = await prisma.customerAddress.findFirst({
        where: { customerId: req.customer.id },
        orderBy: { updatedAt: 'desc' },
      });
      if (next) {
        await prisma.customerAddress.update({
          where: { id: next.id },
          data: { isDefaultShipping: true },
        });
      }
    }

    success(res, null, 'Address deleted');
  })
);

module.exports = router;
