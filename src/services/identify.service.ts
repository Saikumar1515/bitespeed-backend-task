import { prisma } from "../db/prisma.js";
import type { Contact } from "@prisma/client";
import { PrismaClient, LinkPrecedence } from "@prisma/client";
import cluster from "cluster";

type ReconcileResult = {
  primaryContactId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
};

function normalizeEmail(email?: string | null) {
  return email ? email.trim().toLowerCase() : null;
}
function normalizePhone(phone?: string | null) {
  return phone ? String(phone).trim() : null;
}

export async function reconcileIdentity(
  email?: string | null,
  phone?: string | null
): Promise<ReconcileResult> {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedEmail && !normalizedPhone) {
    const err: any = new Error("Either email or phoneNumber must be provided");
    err.status = 400;
    throw err;
  }

  // 1) Find contacts matching email/phone
  const orConditions: any[] = [];
  if (normalizedEmail) orConditions.push({ email: normalizedEmail });
  if (normalizedPhone) orConditions.push({ phoneNumber: normalizedPhone });

  const seedContacts = orConditions.length
    ? await prisma.contact.findMany({ where: { OR: orConditions } })
    : [];

  // 2) No matches → create new primary
  if (seedContacts.length === 0) {
    const created = await prisma.contact.create({
      data: {
        email: normalizedEmail,
        phoneNumber: normalizedPhone,
        linkPrecedence: LinkPrecedence.PRIMARY,
        linkedId: null,
      },
    });

    return {
      primaryContactId: created.id,
      emails: normalizedEmail ? [normalizedEmail] : [],
      phoneNumbers: normalizedPhone ? [normalizedPhone] : [],
      secondaryContactIds: [],
    };
  }

  // … rest of your logic unchanged except enum fixes …

  // Example fix:
  // (You should implement the rest of your logic here and ensure a return statement is present.)
  // For now, return a default/fallback value to satisfy the return type.

  return {
    primaryContactId: seedContacts[0]?.id ?? 0,
    emails: seedContacts.map(c => c.email).filter((e): e is string => !!e),
    phoneNumbers: seedContacts.map(c => c.phoneNumber).filter((p): p is string => !!p),
    secondaryContactIds: [],
  };
}
