import { app } from "./app.ts";
import { initMongoDB } from "./config/dbConfig.ts";
import { SERVER_PORT } from "./config/envConfig.ts";
import { initFirebase } from "./config/firebaseConfig.ts";

try {
    await initMongoDB();
    initFirebase();
    app.listen(SERVER_PORT, () => {
        console.log(`Server running on port ${SERVER_PORT}`);
    });
} catch (err) {
    console.error("Fatal: server failed to start.", err);
    process.exit(1);
}