import jwt from 'jsonwebtoken';

export type JwtPayload = { sub: string; role: 'buyer' | 'seller' | 'admin' };

export const signToken = (payload: JwtPayload) =>
  jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' });

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
