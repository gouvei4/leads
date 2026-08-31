import type { Firestore } from "firebase-admin/firestore";
import type { MessageTemplate } from "./types";

export const TEMPLATES_COLLECTION = "templates";

export async function getTemplates(db: Firestore): Promise<MessageTemplate[]> {
  const snap = await db.collection(TEMPLATES_COLLECTION).get();
  const templates = snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<MessageTemplate, "id">),
  }));
  templates.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  return templates;
}
