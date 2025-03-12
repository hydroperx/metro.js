/**
 * Generates a random 1-5 digits hexadecimal string.
 */
export function randomHex()
{
    return Math.floor(Math.random() * 0xF_FF_FF).toString(16);
}