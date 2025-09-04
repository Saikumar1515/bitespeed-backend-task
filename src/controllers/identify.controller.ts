import type { Request, Response } from "express";
import { reconcileIdentity } from "../services/identify.service.js";

export const identify = async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.body;

    // normalize phoneNumber to string if provided
    const phone = phoneNumber !== undefined && phoneNumber !== null ? String(phoneNumber) : null;
    const contact = await reconcileIdentity(email ?? null, phone);

    return res.status(200).json({ contact });
  } catch (error: any) {
  console.error(" Error in /identify:", error);
  res.status(500).json({ error: error.message || "Internal server error" });
}


};
