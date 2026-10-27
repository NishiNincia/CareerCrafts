import app from "./app.js";
import { ensureResumeSchema } from "./services/resumeSchema.js";

const PORT = process.env.PORT || 4000;

await ensureResumeSchema();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});