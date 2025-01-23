import type { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
const sgMail = require('@sendgrid/mail')

const prisma = new PrismaClient()

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

export const resetTokenValidation = (req: Request, res: Response) => {
  const { token } = req.params;

  if (!token) {
    res.status(401).json({ message: 'Token not provided' })
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

    if (!decoded || !decoded.id) {
      res.status(400).json({ error: 'Invalid or expired token' });
      return
    }

    res.status(200).json({ message: 'Token is valid' })
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' })
  }
}

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
    expiresIn: '5m',
  });

  // sendgrid
  const sendgridKey = sgMail.setApiKey(process.env.SENDGRID_API_KEY as string)
  if (!sendgridKey) {
    res.status(403).json({ error: 'Sendgrid key not provided' })
    return
  }

  const mail = {
    to: user.email,
    // from: 'Taskie <recovery.taskie@gmail.com>',
    from: 'recovery.taskie@gmail.com',
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
                    <img src="data:image/webp;base64,UklGRsobAABXRUJQVlA4TL0bAAAv/8F/EBHHjSQpkqqy9mj8txh7jt4R/Z8A/YUUtGzsqyVLrsm5nEuBxrOUhdYkqZUBOQLwSrZsewDg16smkRgA2ZDtJGGoJ5A9J5EWbl5iRu8qJxzyyPQ7JJ5T80pGTLdAki0dAEkslmy+0bPKszyLmP32CdzatlUr8+MQ7UFE+EugBAaVUDpFuMt1LHbbSLYUlbDuI4Cv0cs/KiJA3wR2DceRJElN6tZzTag3IPlvFgZMEP2fAPwLLyxWCAgBCEAAAsAaOF8XC4sDxsOyhcyOmRI6dgAYRp8VVS74H7g+/6f3v6t+Y1oApW8P/hhnmB5VurdBXygASA1JBRw9xwM91R0A1U5rp1VIEj0APJBuIACQJEkikEQEAC9/e/6tgKZERJCohrBna1RfDABSEamKS4pRBgAkSZKIiFCGVihcwwUAWioiIpwx8F058eBqnDCpuQXtMGcLftGwrJOTcw7fq/Hbwp5nX2j8lRZP+P8pcptt27+6Z3o0Y0lmDp8XMzMzMzPvmHe8xBXzlpmZacWkM8el2PJpkBSBNdxwnPFg1b+q/mMrl36qcHydHebkiufatl3bkiSpzy0YluSV5BMhqCpCkAhpQhLGIgQo1nv3oIBt29nIet6gzUzT0Y72zHpnZ2372LZt27Zt27Zt+6ztYbeZ2fbMJJ8nbLtN27Zt600pl4Zp27Zt21bItm3PqG0Fbdv2nMN2H26t1ZJTkkXbVtVWC9cIrTfhcOgjV4mafhICM3/Z8589/9nznz3/2fOfPf/Z8589LvmHj+beRU0PUnT7YrYb8S4/BDETUcCEaAyUwtj4tPUsTBnL5EGVUwRKYdLgy5HUqr3Qof9PPo1wfQ/zDy9zn6HoSYpuXBFcMpon5hsIoRhGjkkYNVrl+FjCMAWZKBaMDnS85ZgAw4hAxwU/PlAKkwQ6MvgJnCh75X1qCZQkl44E14sEPyfc2bP87cv0i1ekP0V0+0Tp5SoC9w2EKUvviEohEO5E+Llfl394mfulmP/ARHiRiAuSEIoHfl3+8eXFxyvcPZG5XEUaZGEA7lsI3yXc15P87ctLFyc8u8IuV2EgEQHCfTy5VHBVomvEAwRiLOTRpcDFiF00YuThwKe9ucTjihF2FUAoa325FOzsoTCEoU+XnM4u2LmusGDc4tiF8BPC3TxGNv5WzNk84Gqf0u5T+o2Fm1EdI9yV8E/CDb0F4RCx0wsiFktCjUwB4Qb+WorphzkjFwH4cFH4SJ/OkYzjFy9B+Gs+HfaAYAzjFy+h8K4+gRDKhPqwEL6UssNko+KEByG8rg+yqReS9uBtf/xLYGsJlyRc3CukuGOH7UMWxbf3AB7O8flsMtsLwlO77LAZX6S4dYedPeOLYnpJSoRj8B899pUHZnzRxm9mfdHBUbO+aI/jxLHGu6KL/VlfdEEyzuh4Vzw9+ltNIlLwH8ROmvVFwdZZXxBOlY7EVBaE9yiyPekIovIeRHtjf9KKQk9+M4rHcva3QPo216X/7zC+TsUx64tMd8364vq3kI7hfvfC+xKz60/4V9zoMMzcwr+GWV9cdzDsLpVwQDg0gwlmdcI5M6Cl4bW7ooR0DNfdLW9MSThl9q8T9p2pCJpjunZXkxCP4TqShAvO/PVdTYpi4tkNUxvGmDfFEbs75gBnnOnVV+/cLZs7d+v+nbtlf3//Fud79awznXSEo3Z30FwNY8QLSc2CjNRxL/0qAQqYv5PNNVi9pqqqXiPpjmVDccWy25PFmyusuUKRpPtaIxNldyuXln+0/ae3dSZ7CqHvsBIWSPi3c2YeudPkDrTQFK8n1c+Kio5lF8VNLYFnojUTzczG0TJv2fKF1v7iLCEyYxmLz60tNHlNqqtYWcbCRXf4ueLsa52ptrHtm7Gx92UiHIz4IX7fvG6xmTOpdlZULfum+lCIK9VRXSvyXu/l1j5jvB4t1cJ2bBIqt9bxu78DjV0rKiKSHqa7kIk2qY7c7NOxvldlIiYNRM0SwvmEo13yvy2XWbv9Hbv7zUajuqpqYdKNQlw969erfty+ssdlIhMbJtOCNiRkLOPY4yALTV2reoXiDU5dyRVnX7N7e3usedlM5eJzjqN391nTPyLp5NedTOdsNz8uuj87LWbCUuK+duSxt8NtMysqBtMeFeLqa+71Xh+rXuIQCekqS/up3Bqn7nE139iOBINzr1K5ue27cbH7ZSJTCovqhJCJT936PH/OGZSKF9x7livMnX6L827Il90gROJTZ56nzjmDY6BmQ0WnBYZfj7lmf21g+5ItFX11hckbwvGS8LXj95Cq6WegZk1lux/inCtzKNdTG8AbQhPOloNHHnuZb4ynbetoKjdXe26seokDFES9cUc42JwZKUkbO9uzbp7vhtH0Jyf4f+7Q7ntVVYel/S3E1fKf/9kFmYmEMPy1NunX2C+9emH3r74tm0SbaVGv9Yz4JFsfd4M9w8THa8IF/e/icytzDeyRjVh3p0seHut7y7R2h6uvFTN/EpiS6pCG9z5yGzEM4SjXGCz87OG7dcUyw+6EdyypWNZ0gtDTx52Ht4V3OGL6Ht53/jlTop71KU/0duhubhqbg6KaPuoqnJq87yA8D7VFKal2QNIVvw+3XcWyRhpG0mNrNhZMTQLzAwMJu163fkeoVk9xB1xQFG8k6nuuQUY5kj6FhoirITrmIw5gHsKez23c0WJhwxUlFppvvIncQmJ6IsiHj594aC0Fm2gYVU87JPdPLzSxhi21RvvqJx7EEy+87MBaYxm1+nBM+h9O1BtUJ2oGHwb1CXxQrDW5/b3mnLzHwqhWT7eg5L0mRyeSc65GRO2gzCt+zzfeKBtTa+Ft4fYDyVmpguKHk3JPrCsq57CNUdCAglPHvNMRyVnTrxQ3HZV9xRv1GnOQ6hEtNo75wDk8pEUtxJWFwwaAJH0t7/O0xLTqaFDNfAyRnPmK7bQhqKjsoGdCaAzZ8OYGBWe1mnbcIOyrUoqRGmKLkxw+cqhPvKX/S6J3vOfH51JcWqJ7j9fMZx5zeDKrClC0lkd4qyU+6yRuH3ySbNvsb0P4YJDecpR56d0Gn1kyJxIEfEAtfMZr5sMP5Ga2XMMHPPyd/yv1efNabrabl/ABavI1/y/xfd/8rHocde5UNL314rOS+UPkKyjE5QOqVLU5vvfrn902V3GAau5CSJHZMU+hu+EBUugQnJy8CKCaSMzeWYpYEHiA4sibrgDXBGocak6Ly0zkZXiAHLmOddRQBWIhLNHdCvABF582RooqiTglK3d8l4V4+oDmqNECMYlTSOrEAy2/KvQEPEAP0QljBJAdQk52z1K5LvAAnSw6MF6ESiopibb/wAMQajOZxPBsdBxCcsvH6YMNTumIN11MJIA4J0Rk6/zKB5/Ln+Sln5iTxlN/nzj2ikj/7/KOgSGZTh3LwQOs/0lMHlD9A8XxV4QHHpS92OjdfNkDbPxtMU1I9Q+IkLxNScft8xUffK7zT+vOPzDlfls1WjZix+88YJHTl3+SKQ2ovsmixiqZw0+veSFzhel+sgdx4TvRMG0jOhCM3bNcz9qA88keZPrznK4bSM9BpKUi1ryUcD/nf1vr7e8t3u7eNPWMGSG9IMv7ZPLlfto5Ew2Dxrvfl+aR5tAwZgFCEZt9kXA+OyybAMUdd3S6d7r3T94SFtdYMLxYO0/LFcv5tAkAJGrGe9xXHGku1nXC6jMzndzfRA7LZOCR7ug073qfatZrfSYu7rZ0fhM9aJGhQ9K8x33V2Y6gxRDE4f+3zAu4niUyHMDJdvMu9/GaZtBGWkApC3Fh12euOB1PhtxMK4apKMv3uK861g6meBDBmOm04/dwff3uMUbGcFvHeqf7wPShnNJWDhArNd/Ydv4Gh9ElUT+OtL2gZ3ASOIyo5QWcW/gaTj/OrEgw3M4mRhPGxXGiA1Zdg/PoYRbB9QY+otGwdrt99PhA6hoz0UDXDK1H5eCxx/4qyofbWSYTHI/o1nt26Zqg531HxX+obSZcTgeemySWeWNaq4SSgI07QqJuuByFXiITBRMLx8kOAQR9B+cktP/F8XvYdLkpxiWaE4ZztJ02GiUmCEDM1b9dzgUkJqSm36goIyqPPfcXCxeHcy8VJkVx85ZO5ynBUyzeWavDzSKaMHlEC01atVqWvf/YWsTiWrmdVCTRO9xNk5SYnKpeUdNAzwAOCXhdHH7sIpIeziamWmWmOiz9GcdMPb/KRxh8LhabtTrbNsYKTBfVfBNbs8Gx2v3xz5b4kjL154wryBDrgOmoqs5ngaDX7r8ZLjYwOZO07o8PT9aQ319c31A4lzNuYIkVpkRx87i96RbeNhy6m68G5nj8NxtfK6zvFlcTHEAzTB/YYtNXAwYNEK7mI5HoE4CByt/n5BeVqh/hsZ4VBKbHwDmy7/qEeOevPAc+9NrD7QQ07gix0mEm3i7yt3J8bn79Wi67iTl1UwOx7HLQVkwsPhYH7zagm41kqIGrlD/B9eWl5r8Ri2khVoOW4I63X8HAguioPdxOvaaNdjZgRASXMb4jv74hf1r7BLQHzUFPdHMGrR68/qSSBVXVoZ11rCPb+G8a55ifX1JNsJN/AuihoirNQMG7PqF/n1OH5pgoOjT+M+tfCBby5Gas0EQssyyYyoih9KxYuHNBO33E2Di2aPwFm/Zth7p7ydAX4GE7CUYskT0Jhxo40Khp1U8VPUEka4hfzeYDdnE1FfRxoLEH0M81gexB+VRU1TSL2DNKu9roIHR2MVEXmhm1C9KhUmBAGcsOc7mwto0mKaGRWPkw8FXkYefvZIqX5tIxSRvW7GrWyUOHbM3c2AZfCjTuKDD3Tyxto42xAprDXDCJfES9xtUACWLKNizY1ayZRqNW+RgqKtsAd822rG7jX1lBN1XV7R3BTqCiog3wXmI2t9FKrT/QimpmDV4UkSAN8D7MPNbBuGxs4woS+omkw6zBUxIzIvxrwdcaJBIsJiL/1sK5g2XqzcL3MFzbKFBGelPTh9mOvvUXjHf60lV7x5veE/XbCCZ44G5m+si6NP45/EKG5ZmklhmY4KBZDHf1rb5gvOOXLudJjHGRaGCm77+yZD6mIbQ28o/E9ecMx8OKGeGYncH04h0xViTVMhT2xYyW2DaQv1BSzNpQ1EsMzHC8vXhnwgE7UVW7byrw6hR6gjsHrNpIMc5hwhCnHLLPYJhDjPSaMHdFUV2EnuAyJKc2thEwxQn7FgOBONotCzcRSbe54LNUmqJ75PfExaWNlQBjHLf3ZLGdz2sSEwub/0aAq5Q/Jy4WbRTUN81xxvEbJoOdT+EvQZQGuRlTaQtwLfyweJpvo4lsEpjjtMOKy9Z+h1x3LjtBrEx2fTW8rC3ADHmO+X5xGa48s8rAICcdumEyyKMexjeaLs2hQI2JcMrdUS+ZJKVYCjDJKYeufKyy8sXBh8dbUblrtvuvpwiNIW7RMLgdKkVuAIxyi1OSUV3NWmH1jxzKBjypM8YN5M+J578xhvjXJQ2znHVCcFqbYCGEPASWlpTeINcifrJkLmfMHFDaMGcch9c9COmTI88HO2cCPHk3y59fUk2dDJxJyjicLA5elIi4qXsuQIb44e6cumnqYj4vZx3H+BP8cSanhxrlEkuzwbNqpY9mneQIvczYD8YNc/5/XzSuYv8OSPeIfWLNmA7lOoAB7Ib5bWYnyEOgRZ5mi6K5AuAAu2GuYRWIwBLzAFNSLEuswIEzji5uwxz8YyZ/wOQAYCkWrseVYsEJ++1Lx7LQU1y+RFhyCcCDUw5bfWcwLoiSSypWKBhSUDeBCacdMaUhxgpixWbzQ4FiRxO5GsCEUw5dpSNyhWSTjf0UwYxXmgMBF47bc0pHpDqaTz6e6yB4sRTAhuP2mN4xcBOKF4CL2suQGwA+HLdbGR9v5wh2hr7WZTARrmnvX5c0GHHYVsFukCn4RvS3IVlvKDA5pZkTC5sQ0hFtSwwmwy3tXUE2gRWJOuwkxjeit9UGYdSee/ZjEvGdwbhonT8NXmaaU9rbZ/Ze9fqaeU8GJZNfmWWkZZMOgsM5hHmRKa7yEZl8s7v4D4Vp+hzCSwyYkepudhbgH5ErJLusLFGlWEyfQ5gbuYR8DF1rttyyu/gCEuzo2rhjvgOOk0cmdvyKYWZWOGH0gNL82NgK/hHsRGs/G8AR7XUQNxmyaTX5iN7WS3UccLwKjB7C1AGlOY5OqnCQKZCPQKojOGbluR6YeYMoy4QjqWJQYGfwkOhZN1jmZYkotIm1z4EjXdGQkGj6PXlm5sl97SjUEiFgyaYVWXB4z8CAcntfYZqbC0j9GxyYHqh0zUoSEk+l2jdcrwdD+wYHnvQV1sek42DwqVwwpQm6X1zOlJ6uwWGYfSha/lu4JqhJtlNofXE5VzYsHz4SDMWm97HNzirEKK2XC8p0zRWLcBhkt8mmNP3pcbb5WSdtDI2XC8p2jYwE+pqTb4ZWgFB6jifOeIC6Vi483uexD8Vmnw7GOTqHmWFoOYU0Y1a9miye63lRbOwDnK84dJWlhpcYdBPwJROta94GBH4GVzw4szRk8vpamnOG2jlTw4HLGNO1ipgMuOqnhTM3N9mYkjSAM+veX+QkruxxvN9rxnSzEC4B779VyEWPkZPIRHrWFWtWQxc51cZJ1nStbkEJbPbJwjtRzaFCc2J2KJoErFnz5sJkwN0mp7K+VzG/5uh1aGNMyAurDFiTidaHJCWyIl3LMU/WCkx2YZ+vPwfetC0J5+i2NFDAai8N9ml6cgIU1Utgznl3Dq7jXIBrLBguYmufSnVM7pxDTTDRZJsBc3rWb6760eC3p5QkBpt9PthnapXFWJbQ4M69PtiSlrjsMfzfdEKcemwU3Hnsgof4UgpsLDORZv8G/2ytjh6zvYk9LQtkcqQlcNH9WYiLPU3ophxBPPVN9ry87OrhQ0smR8EZFp0Wa7e4LchYbdQQ2ymaBNxR3HxrZ85rDQlLYMWt42ULctYJQxPSwJ6a+nHMHB4TfA0P9qxlATdTxOA8I/7cYv/pSflNZLnYA2nDzapEhgAhlnJYQKJ6sLr1qdj2va4VrMhYFVqDFbecDT4TOOeGLMRlA58qBitu5eTodA4+iB/KvlclhtdzK6y4ZeQK0wu8fMxccjM8uNNv4QVO270EJ3DeDZnKTQ8wZzMNA3nOgvAWmchqzw33o7h5qwPLc4K5wKqX9awr57NghFgWt829TpNpXpd3cRZ6yvWctiPvCe6WbYtt+YbjeUx8AvecyzLVXk4nV1j/2ynJf5CD9wxYdkUW4nI5G/skWubxroFlj47dPUpx090sNiXgYXmWA0ZyNrFsNwwjRFE32EOOJhKMk/Zjg6UXBebvRJF0uplFU6ccDeFgs8vJVPWKinI8x9t5lkwFEr05GCVt0QSiFHWNYhnu3d9wyObTk8IWgVoDKCmu5YDhpClQr9G+W6mqjmdsMXjNsYk90Jh2KrFsxEIel/ODV5SXQyFUTQN/GziLSFYkCGei+DlvFJlalogEHAmxGcsQq0jUUbxwIoq3VFStchWIynAi1VWmNTrjuiPsMgQUutt9JNUF90F2mzaUXGT7f98FAaFdR67YXteOhQKB4qfb6NpQ0hWg4LZaIZ6pjsWC53rjJcazDvaxELezIMpckY/FOIMd9K2TybejKPRU23JSNiDT6S1OgpA9reQskMnrWMFB5IqVikhalGV/G7oQl2so9ETPekIWQyK0LRq5QruFnuZI5VnTS++LYQNa+09uE4dQiHvLTwF/C3sF2hbra+UMXtzyK5kLPL+zX0ahp91AT4uWxay2ANdYWiWArX3DBVsgcsW55ad8wmoLxvMi7PhNx3LWN5uJYs0HIGsxzgCseylzXeze1LjjLy2LWPc73nFa0cZ4ga195ZWX7aVnbV1wX0Ie2lnmjXfnvboqKtNOcptqw2dLyzyWW4AYDMAtnetoO1YknfbxcssCFzwIs4MlYllvfe/suiGtuGkZfc297NrM5MwUAqgb4g33xkrUp030tdSKu0bLvxww3cMVxR0CONJ2znT8TNQPW8jk57p3c82bIBHtH4IAHGl7dlQy+Vr12jjnZphVhBWVnnXzHtfnq3CLQRgCWDDe2XvarBsS+4z/r9G2oM+5bax5C4RjcMLe70SDW+/ZNW9MMf2zBaVys+mveKMLMpOD2cfBVJzsYEfbaZ3TP9n981yxOpbWJU8tTwMzk0CoaXC6oy02dVZVD06/b3rWrhs+3b7gIZkcCEW4SoACGpqccuQ80Miuqs59FqcM71lb237eOu8umQ4jhnqW8lp59ri9LTZ9TdQy/Bwkld/0bMh1742LnkASIMYlQy0sB0JYMNHJDqk5A9aKihHLDEPretpj27zlis91NAMgHOE8B8sLh23rQCPXisqqKMtIsOgks2lNRdXTNq5aMNZ859q6WVGEaxEdsrkF4zQavsaylaiJzMaDqUnlD3L/d6orupq3t/evbf96ngJKCEtHvSx4tMMhxMq8cECTWv3UNGyUdBe6u6rKY4qyYAXESkck2CJAX34PUMiCNVH35RKPpzq3emvLlhW6mm351z9th51/237bb9xZrnhJx0ou/RvfBDk58Y+pCX+w3NCRGHFb7jqydM9AyVf4Rgrua+WGi9BuuevTIG7D7h9xfUERl11HQtxivOF6o2HmFv/7n7jRJpxnKW4L5sa/FFxjkLXl/YKEtMX9DyTmeqNh97240SZ2HQniHjXMzD7vkHgnSd9QSC5uPcQ5TPqC2MXs/0D6ogD7PxC/inOS/R+Iv67mrdZDeb8R/9qi5BzrIc6XKYf07xEvdch6KP+lxAVhP+hYo6UQ5/fWQ3g28U6VvagspOjL1kN4L/GOkr2oyJxK+Jn1EN5Pee97XPQqrnjBEbAewk+I/0jinyN5UT3lMsU32Q9hj/BG4v6JiOBFsqoTCd90QBYIH6O8J1I+wVtZRiH+NBwA4WjCUyj/mAfEbqidmpMIr3JDJmg8nhZfNox4WwjCLj26HOFdrug/4UXFenaEbkqU5NFwBcS9OOH6YVgKkqYYMu6VY8ld3JECWvzkQnyxYUVNf+wUc57rkhwQHk5LCNx8UJLbuCULlK5HEuK2IPm4eDxd3C08RDPSFhG2M9zENXmgdV+M2NZ9zvYlUNoMTIuY5Rfin0nkAQQhEw35dG4+nemmdBAOEfsrcQjZCBSdWMXRzsoI4VuKd+YjAkZBMjuH2M8JhxyWFOJ+knCkktonIl2SQdExxfiI29LysFrqnpHS/8i2kqxKVdlhxN5C+KvrMkN4BeHyav6tlJLfKMHZai6hEq9EXcN+oupfhNcRvuTA7BBOIrydcC214PKRkjcqpf9SglPVfMQhTKKlVJVr6HP2nLp/RUt/viJ84L5LE/W35tylGA8i3JxwcWKIXR4gOnLy6RN65lYYinkMpdaIKUwbVjl1b/WFVepOY1FycZJcvFScQ9H8vUK8p/h/J8nPCV/CzF/2/GfPf/b8Z89/9vxnz3/2/GdvCwAA" alt="Logo" style="width: 80px; height: auto;">
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center;">
                    <h1 style="font-size: 24px; margin-bottom: 20px; color: #ededed">Reset Your Password</h1>
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
  };

  try {
    await sgMail.send(mail);
    res.status(200).json({ message: 'Reset link sent to your email' });
  } catch (error) {
    console.error('SendGrid Error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token) {
    res.status(400).json({ error: 'Token not provided' });
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

    if (!decoded || !decoded.id) {
      res.status(400).json({ error: 'Invalid or expired token' });
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: decoded.id },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token has expired. Please request a new password reset.' });
      return
    }
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};
