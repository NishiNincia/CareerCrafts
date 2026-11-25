import app from "./app.js";
import { ensureResumeSchema } from "./services/resumeSchema.js";
import { startResumeAnalysisWorker } from "./services/resumeAnalysisWorker.js";
import { ensureJobListingsSchema } from "./services/jobListings.js";
import { ensureCommunicationSchema } from "./services/communicationSchema.js";
import pool from "./config/db.js";

const PORT = process.env.PORT || 4000;

await ensureResumeSchema();
await ensureJobListingsSchema(pool);
await ensureCommunicationSchema(pool);
startResumeAnalysisWorker();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});