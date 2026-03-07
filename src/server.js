const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(process.cwd(), ".env") });

const config = require("./config");
const mongoose = require("mongoose");
const app = require("./app");

async function main() {
  try {
    await mongoose.connect(config.database_url);
    console.log("🛢 Database is connected successfully");

    app.listen(config.port, () => {
      console.log(`Application listening on port ${config.port}`);
    });
  } catch (err) {
    console.error("Failed to connect to database", err);
  }
}

main();

