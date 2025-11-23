import { prisma } from './prisma'

const ATTACHMENT_LIMIT = 10
const RESET_HOURS = 4

export async function checkAttachmentLimit(userId: string): Promise<{
  allowed: boolean
  remaining: number
  resetAt: Date | null
}> {
  let limit = await prisma.attachmentLimit.findUnique({
    where: { userId },
  })

  const now = new Date()

  // If no limit record exists or reset time has passed, create/reset it
  if (!limit || limit.resetAt < now) {
    const resetAt = new Date(now.getTime() + RESET_HOURS * 60 * 60 * 1000)
    
    if (!limit) {
      limit = await prisma.attachmentLimit.create({
        data: {
          userId,
          count: 0,
          resetAt,
        },
      })
    } else {
      limit = await prisma.attachmentLimit.update({
        where: { userId },
        data: {
          count: 0,
          resetAt,
        },
      })
    }
  }

  const remaining = Math.max(0, ATTACHMENT_LIMIT - limit.count)
  const allowed = remaining > 0

  return {
    allowed,
    remaining,
    resetAt: limit.resetAt,
  }
}

export async function incrementAttachmentCount(userId: string): Promise<void> {
  const limit = await checkAttachmentLimit(userId)
  
  if (!limit.allowed) {
    throw new Error('Attachment limit reached')
  }

  await prisma.attachmentLimit.update({
    where: { userId },
    data: {
      count: {
        increment: 1,
      },
    },
  })
}

export async function getAttachmentLimitInfo(userId: string) {
  return await checkAttachmentLimit(userId)
}

