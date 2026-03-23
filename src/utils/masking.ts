// Ziratstan.kz - Data Masking & Cryptography Utils
// Соответствует Закону РК о персональных данных.

import crypto from 'crypto';

/**
 * Маскирует ФИО для дашбордов и публичных списков
 * Пример: "Ермеков Азамат" -> "Е****** А*****"
 */
export function maskFullName(name: string): string {
  if (!name) return '';
  return name.split(' ').map(word => {
    if (word.length <= 1) return word;
    return word.charAt(0) + '*'.repeat(word.length - 1);
  }).join(' ');
}

/**
 * Хеширует пароль/PIN с солью для хранения в БД
 */
export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(pin, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Проверяет PIN с хешем из БД
 */
export function verifyPin(pin: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const hashToVerify = crypto.pbkdf2Sync(pin, salt, 10000, 64, 'sha512').toString('hex');
  return hashToVerify === originalHash;
}
