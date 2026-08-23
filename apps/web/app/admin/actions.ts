"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";

export async function retryJob(jobId: string) {
  await query(
    `UPDATE ingestion_jobs
     SET status = 'pending', error = NULL, locked_at = NULL, locked_by = NULL,
         available_at = now(), updated_at = now()
     WHERE id = $1 AND status = 'failed'`,
    [jobId],
  );
  revalidatePath("/admin");
}
