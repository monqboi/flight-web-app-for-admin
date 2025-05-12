import bcrypt from 'bcryptjs';

const plainPassword = 'superadmin123';
const hashed = await bcrypt.hash(plainPassword, 10);
console.log(hashed);
