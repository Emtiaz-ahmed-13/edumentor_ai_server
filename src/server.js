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
