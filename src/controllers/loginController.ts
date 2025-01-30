import type { Request, Response, CookieOptions } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
const sgMail = require('@sendgrid/mail')

const prisma = new PrismaClient()

declare module 'express' {
  export interface CookieOptions {
    partitioned?: boolean
  }
}

interface JWTPayload {
  id: string
  email: string
  name: string
  roleName: string
}

export const loginUser = async (req: Request, res: Response) => {
  console.log('init loginUser')
  const { email, password, rememberMe } = req.body

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  })

  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const expiresIn = rememberMe ? '30d' : '1d'
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      roleName: user.role.name,
    },
    process.env.JWT_SECRET as string,
    { expiresIn }
  )

  res.cookie('authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    path: '/',
  })

  res.status(200).json({ message: 'Login successful' })
}

export const tokenValidation = (req: Request, res: Response) => {
  console.log('init tokenValidation')
  const token = req.cookies.authToken

  if (!token) {
    res.status(401).json({ message: 'Token not provided' })
    return
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JWTPayload
    const { id, email, name, roleName } = decoded
    res.status(200).json({ user: { id, email, name, roleName } })
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' })
  }
}

export const resetTokenValidation = (req: Request, res: Response) => {
  console.log('init resetTokenValidation')
  const { token } = req.params

  if (!token) {
    res.status(401).json({ message: 'Token not provided' })
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string
    }

    if (!decoded || !decoded.id) {
      res.status(400).json({ error: 'Invalid or expired token' })
      return
    }

    res.status(200).json({ message: 'Token is valid' })
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' })
  }
}

export const forgotPassword = async (req: Request, res: Response) => {
  console.log('init forgotPassword')
  const { email } = req.body

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
    expiresIn: '5m',
  })

  // sendgrid
  const sendgridKey = sgMail.setApiKey(process.env.SENDGRID_API_KEY as string)
  if (!sendgridKey) {
    res.status(403).json({ error: 'Sendgrid key not provided' })
    return
  }

  const mail = {
    to: user.email,
    from: 'Taskie <recovery.taskie@gmail.com>',
    // from: 'recovery.taskie@gmail.com',
    subject: 'Reset your password',
    html: `
      <!DOCTYPE html>
      <html style="background-color: #171717; color: #ededed; font-family: Arial, sans-serif; display: grid; place-items: center; height: 100%;">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password</title>
      </head>
      <body style="margin: 0; padding: 0; color: #ededed; font-family: Arial, sans-serif; ">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table cellpadding="0" cellspacing="0" border="0" style="max-width: 300px; background-color: #27272A; border-radius: 8px; padding: 24px;">
                <tr>
                  <td align="center">
                    <img src="https://i.imgur.com/rXjBH88.png" alt="Logo" style="width: 80px; height: auto;">
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center;">
                    <h1 style="font-size: 24px; margin-bottom: 20px; color: #ededed">Reset your password</h1>
                    <p style="font-size: 16px; margin-bottom: 20px; color: #ededed">Click the button below to reset your password:</p>
                    <a href="${process.env.CLIENT_URL}/reset-password/${token}" style="display: inline-block; background-color: #F9C52B; color: #27272A; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-weight: bold;">Reset password</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 20px 0; font-size: 12px; color: #ededed;">
                    If you did not request a password reset, please ignore this email.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  }

  try {
    await sgMail.send(mail)
    res.status(200).json({ message: 'Reset link sent to your email' })
  } catch (error) {
    console.error('SendGrid Error:', error)
    res.status(500).json({ error: 'Failed to send email' })
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  console.log('init resetPassword')
  const { token } = req.params
  const { password } = req.body

  if (!token) {
    res.status(400).json({ error: 'Token not provided' })
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string
    }

    if (!decoded || !decoded.id) {
      res.status(400).json({ error: 'Invalid or expired token' })
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: { id: decoded.id },
      data: { password: hashedPassword },
    })

    res.status(200).json({ message: 'Password updated successfully' })
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Token has expired. Please request a new password reset.',
      })
      return
    }
    console.error('Error resetting password:', error)
    res.status(500).json({ error: 'Failed to reset password' })
  }
}
