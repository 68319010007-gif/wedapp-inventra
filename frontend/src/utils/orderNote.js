const SHIPPING_MARKER = '---SHIPPING---';

const RESIDENCE_LABELS = {
  HOUSE: 'account.residence.house',
  CONDO: 'account.residence.condo',
  TOWNHOUSE: 'account.residence.townhouse',
  APARTMENT: 'account.residence.apartment',
  OTHER: 'account.residence.other',
};

const VEHICLE_LABELS = {
  TRUCK_4_AND_6: 'account.vehicle.both',
  TRUCK_4_ONLY: 'account.vehicle.truck4',
  TRUCK_6_ONLY: 'account.vehicle.truck6',
  NONE: 'account.vehicle.none',
};

/** แยกหมายเหตุลูกค้า กับที่อยู่จัดส่งจาก note ที่ checkout บันทึกไว้ */
export function parseOrderNote(note) {
  if (!note?.trim()) {
    return { customerNote: '', shipping: null };
  }

  let working = note;
  let shipping = null;

  const markerIdx = working.indexOf(SHIPPING_MARKER);
  if (markerIdx >= 0) {
    const afterMarker = working.slice(markerIdx + SHIPPING_MARKER.length).trim();
    const jsonLine = afterMarker.split('\n')[0]?.trim();
    try {
      shipping = JSON.parse(jsonLine);
    } catch {
      /* ignore invalid JSON */
    }
    working = working.slice(0, markerIdx).trim();
  }

  const shippingRegex = /Ship to:\s*([^|]+?)(?:\s*\|\s*Phone:\s*([^|]+?))?(?:\s*\|\s*Address:\s*(.+))?$/m;
  const match = working.match(shippingRegex);

  if (!shipping && match) {
    shipping = {
      name: match[1]?.trim() || '',
      phone: match[2]?.trim() || '',
      address: match[3]?.trim() || '',
    };
  }

  const customerNote = working.replace(shippingRegex, '').trim();

  return { customerNote, shipping };
}

export function formatAddressOneLine(addr) {
  if (!addr) return '';
  if (addr.formatted) return addr.formatted;
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
  return parts.join(' ') || addr.address || '';
}

/** รายการฟิลด์ที่อยู่สำหรับแสดงในแอดมิน */
export function getShippingDetailRows(shipping, t) {
  if (!shipping) return [];

  if (shipping.firstName || shipping.houseNo || shipping.label) {
    const fullName = [shipping.firstName, shipping.lastName].filter(Boolean).join(' ');
    const rows = [
      shipping.label && [t('account.addressLabel'), shipping.label],
      fullName && [t('account.firstName') + ' / ' + t('account.lastName'), fullName],
      shipping.phone && [t('account.recipientPhone'), shipping.phone],
      shipping.phoneAlt && [t('account.recipientPhoneAlt'), shipping.phoneAlt],
      shipping.houseNo && [t('account.houseNo'), shipping.houseNo],
      shipping.moo && [t('account.moo'), shipping.moo],
      shipping.village && [t('account.village'), shipping.village],
      shipping.floor && [t('account.floor'), shipping.floor],
      shipping.room && [t('account.room'), shipping.room],
      shipping.soi && [t('account.soi'), shipping.soi],
      shipping.road && [t('account.road'), shipping.road],
      shipping.subdistrict && [t('account.subdistrict'), shipping.subdistrict],
      shipping.district && [t('account.district'), shipping.district],
      shipping.province && [t('account.province'), shipping.province],
      shipping.postalCode && [t('account.postalCode'), shipping.postalCode],
      shipping.residenceType && [
        t('account.residenceType'),
        shipping.residenceType === 'OTHER' && shipping.residenceOther
          ? shipping.residenceOther
          : t(RESIDENCE_LABELS[shipping.residenceType] || shipping.residenceType),
      ],
      shipping.hasElevator != null && [
        t('account.hasElevator'),
        shipping.hasElevator ? t('common.yes') : t('account.no'),
      ],
      shipping.vehicleAccess && [
        t('account.vehicleAccess'),
        t(VEHICLE_LABELS[shipping.vehicleAccess] || shipping.vehicleAccess),
      ],
      shipping.mapAddress && [t('account.pinLocation'), shipping.mapAddress],
      shipping.lat != null && shipping.lng != null && [
        t('admin.sales.mapCoords'),
        `${shipping.lat}, ${shipping.lng}`,
      ],
    ].filter(Boolean);

    const oneLine = formatAddressOneLine(shipping);
    if (oneLine) rows.push([t('auth.address'), oneLine]);
    return rows;
  }

  if (shipping.name || shipping.address) {
    return [
      shipping.name && [t('common.name'), shipping.name],
      shipping.phone && [t('auth.phone'), shipping.phone],
      shipping.address && [t('auth.address'), shipping.address],
    ].filter(Boolean);
  }

  return [];
}

export function getProductImage(product) {
  if (!product) return null;
  return product.images?.[0]?.url || product.image || null;
}

export { SHIPPING_MARKER };
