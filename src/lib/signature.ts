// A signature is kept as the pen strokes themselves ("M x y L x y ..." on a
// 600 x 260 sheet), not as a picture: it is a few kilobytes and stays sharp.
export const SIGNATURE_WIDTH = 600;
export const SIGNATURE_HEIGHT = 260;
export const SIGNATURE_MAX_LENGTH = 20000;

export function isSignature(value: string | null | undefined): value is string {
  return !!value && value.length >= 30 && value.length <= SIGNATURE_MAX_LENGTH && /^[ML0-9 ]+$/.test(value);
}
