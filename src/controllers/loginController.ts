import type { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
const sgMail = require('@sendgrid/mail')

const prisma = new PrismaClient()
const sendGridKey = process.env.SENDGRID_KEY
const clientURL = process.env.CLIENT_URL

interface JWTPayload {
  id: string
  email: string
  name: string
  roleName: string
}

export const loginUser = async (req: Request, res: Response) => {
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
    secure: process.env.NODE_ENVIRONMENT === 'prod',
    sameSite: 'strict',
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
  })

  res.status(200).json({ message: 'Login successful' })
}

export const tokenValidation = (req: Request, res: Response) => {
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

export const forgotPassword = async (req: Request, res: Response) => {
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
  const sendgridKey = sgMail.setApiKey(sendGridKey)
  if (!sendgridKey) {
    res.status(403).json({ error: 'Sendgrid key not provided' })
    return
  }

  const mail = {
    to: user.email,
    from: 'recovery.taskie@gmail.com',
    subject: 'Taskie! Reset password  ',
    html: `
     <a href="${clientURL}/reset-password/${token}">
       Click here to reset your password
     </a>
   `,
  }

  sgMail
    .send(mail)
    .then(() => {
      console.log('Email sent')
    })
    .catch((error: string) => {
      console.error(error)
      res.status(406).json({ error })
      return
    })

  res.status(200).json({ token })
}

export const resetPassword = async (req: Request, res: Response) => {
  const resetLink = req.params.token
  const decoded = jwt.verify(
    resetLink,
    process.env.JWT_SECRET as string
  ) as JWTPayload

  if (!decoded) {
    res.status(400).json({ message: 'Incorrect token or expired' })
    return
  }
  const { id } = decoded
  const newPassword = req.body
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  try {
    const updatedPassword = await prisma.user.update({
      where: { id: id },
      data: {
        password: hashedPassword,
      },
    })

    res.status(200).json({ message: 'Password updated' })
  } catch (error) {
    res.status(500).json({ message: error })
  }
}
