import express from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import type { Contact } from "@prisma/client";

const app = express();
app.use(express.json());

const prisma = new PrismaClient();

app.post("/identify", async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res
        .status(400)
        .json({ error: "Either email or phoneNumber is required" });
    }

    // 1. Find all contacts matching email or phone
    const seedContacts = await prisma.contact.findMany({
      where: {
        OR: [
          email ? { email } : undefined,
          phoneNumber ? { phoneNumber } : undefined,
        ].filter(Boolean) as any,
      },
      orderBy: { createdAt: "asc" },
    });

    let primaryContact: Contact | null = null;

    if (seedContacts.length === 0) {
      // No match: create new primary
      primaryContact = await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: "PRIMARY",
        },
      });
    } else {
      // 2. Find all related contacts (by traversing linkedId)
      // Get all unique primary ids
      const primaryIds = Array.from(
        new Set(
          seedContacts.map((c) =>
            c.linkPrecedence === "PRIMARY" ? c.id : c.linkedId!
          )
        )
      );

      // Fetch all contacts linked to any of these primaries
      const allContacts = await prisma.contact.findMany({
        where: {
          OR: [
            ...primaryIds.map((id) => ({ id })),
            ...primaryIds.map((id) => ({ linkedId: id })),
          ],
        },
        orderBy: { createdAt: "asc" },
      });

      // Find all primaries among them
      const primaries = allContacts.filter(
        (c) => c.linkPrecedence === "PRIMARY"
      );
      // Oldest primary becomes the true primary
      primaryContact = primaries.reduce((oldest, c) =>
        c.createdAt < oldest.createdAt ? c : oldest
      );

      // If there are multiple primaries, demote the newer ones to secondary
      for (const p of primaries) {
        if (p.id !== primaryContact.id) {
          await prisma.contact.update({
            where: { id: p.id },
            data: {
              linkPrecedence: "SECONDARY",
              linkedId: primaryContact.id,
            },
          });
        }
      }

      // Relink any secondaries that pointed to the demoted primaries
      for (const p of primaries) {
        if (p.id !== primaryContact.id) {
          await prisma.contact.updateMany({
            where: { linkedId: p.id },
            data: { linkedId: primaryContact.id },
          });
        }
      }

      // 3. If this exact email/phone doesn't exist, add as secondary
      const alreadyExists = allContacts.some(
        (c) => c.email === email && c.phoneNumber === phoneNumber
      );
      if (!alreadyExists) {
        await prisma.contact.create({
          data: {
            email,
            phoneNumber,
            linkPrecedence: "SECONDARY",
            linkedId: primaryContact.id,
          },
        });
      }
    }

    // 4. Gather all contacts for response
    const relatedContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { id: primaryContact.id },
          { linkedId: primaryContact.id },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    const emails = Array.from(
      new Set(relatedContacts.map((c) => c.email).filter((e): e is string => !!e))
    );
    const phoneNumbers = Array.from(
      new Set(relatedContacts.map((c) => c.phoneNumber).filter((p): p is string => !!p))
    );
    const secondaryContactIds = relatedContacts
      .filter((c) => c.linkPrecedence === "SECONDARY")
      .map((c) => c.id);

    return res.json({
      contact: {
        primaryContactId: primaryContact.id,
        emails,
        phoneNumbers,
        secondaryContactIds,
      },
    });
  } catch (error: any) {
    console.error(" Error in /identify:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

export default app;
