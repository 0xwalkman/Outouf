export const suppliers = {
  jmshop88: { userId: '43898', passwordEnv: 'YUPOO_JMSHOP88_PASSWORD', public: true, cache: 'work/yupoo/jmshop88', remoteOnly: true },
  jygy2: { userId: '3752950', passwordEnv: 'YUPOO_JYGY2_PASSWORD', public: true, cache: 'work/yupoo/jygy2', remoteOnly: true },
  qiumishijie: { userId: '33648', passwordEnv: 'YUPOO_QIUMISHIJIE_PASSWORD', public: true, cache: 'work/yupoo/qiumishijie', remoteOnly: true },
  '351164': { userId: '2693236', passwordEnv: 'YUPOO_351164_PASSWORD', public: true, cache: 'work/yupoo/351164', remoteOnly: true },
  jifan01: { userId: '339963', passwordEnv: 'YUPOO_JIFAN_PASSWORD', public: true, cache: 'work/yupoo/jifan01', remoteOnly: true },
  'hhhhhh789-123': { userId: '3980282', passwordEnv: 'YUPOO_XJCLOTHES_PASSWORD', public: true, cache: 'work/yupoo/hhhhhh789-123', remoteOnly: true },
  doufuyi: { userId: '3692713', passwordEnv: 'YUPOO_DOUFUYI_PASSWORD', public: true, cache: 'work/yupoo/doufuyi', remoteOnly: true },
  cf1688: { userId: '3912868', passwordEnv: 'YUPOO_PASSWORD', cache: 'work/yupoo' },
  mujichaopaia: { userId: '3437196', passwordEnv: 'YUPOO_CLOTHING_PASSWORD', cache: 'work/yupoo/mujichaopaia', remoteOnly: true },
  '888xm888': { userId: '3374551', passwordEnv: 'YUPOO_888XM888_PASSWORD', cache: 'work/yupoo/888xm888', remoteOnly: true },
  'alina-fashion-store2': { userId: '98740', passwordEnv: 'YUPOO_ALINA_PASSWORD', public: true, cache: 'work/yupoo/alina-fashion-store2', remoteOnly: true },
};

export function imageSupplier(sourcePath = '') {
  const match = /^\/([a-z0-9-]+)\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+\.(?:jpe?g|png|webp|gif)$/i.exec(sourcePath);
  return match && Object.hasOwn(suppliers, match[1]) ? match[1] : null;
}
